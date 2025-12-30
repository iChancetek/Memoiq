
'use server';
/**
 * @fileOverview A RAG-based AI assistant that can answer questions based on user data.
 *
 * - getRagResponse - A function that returns a response from the AI assistant.
 * - GetRagResponseInput - The input type for the getRagResponse function.
 * - GetRagResponseOutput - The return type for the getRagResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { TaskSchema, ContactSchema, CalendarEventSchema, MemoSchema, ScribeEntrySchema } from '@/lib/data';
import type { Task, Contact, CalendarEvent, Memo, ScribeEntry } from '@/lib/data';
import { format } from 'date-fns';
import { getServerFirebase } from '@/firebase/server';
import { gpt4o } from 'genkitx-openai';
import { type Message } from '@genkit-ai/core';

const { firestore: db } = getServerFirebase();

// Define tools for the AI to use
export const getTasks = ai.defineTool(
  {
    name: 'getTasks',
    description: 'Retrieve a list of the user\'s tasks. Can be filtered by status (e.g., "completed", "pending").',
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      status: z.enum(['completed', 'pending']).optional().describe('The status of tasks to retrieve.'),
    }),
    outputSchema: z.array(TaskSchema),
  },
  async ({userId, status}) => {
    console.log('Tool: getTasks called with status:', status);
    let q = db.collection(`users/${userId}/tasks`);
    if (status) {
        // @ts-ignore
        q = q.where('completed', '==', status === 'completed');
    }
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any) as Task[];
  }
);

export const getContacts = ai.defineTool(
  {
    name: 'getContacts',
    description: "Retrieve the user's contact list. Can be filtered by name.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique 'ID'."),
      name: z.string().optional().describe("The name of the contact to search for."),
    }),
    outputSchema: z.array(ContactSchema),
  },
  async ({userId, name}) => {
    console.log('Tool: getContacts called with name:', name);
    let q = db.collection(`users/${userId}/contacts`);
    if (name) {
        // @ts-ignore
        q = q.where('name', '==', name);
    }
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any) as Contact[];
  }
);

export const getCalendarEvents = ai.defineTool(
  {
    name: 'getCalendarEvents',
    description: "Retrieve calendar events or appointments for a given date range. Default is today.",
    inputSchema: z.object({
        userId: z.string().describe("The user's unique ID."),
        startDate: z.string().optional().describe("Start date in YYYY-MM-DD format."),
        endDate: z.string().optional().describe("End date in YYYY-MM-DD format."),
    }),
    outputSchema: z.array(CalendarEventSchema),
  },
  async ({userId, startDate, endDate}) => {
    console.log('Tool: getCalendarEvents called with:', {startDate, endDate});
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    end.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection(`users/${userId}/events`)
        .where('startTime', '>=', start)
        .where('startTime', '<=', end)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
        } as any;
    }) as CalendarEvent[];
  }
);

export const getMemos = ai.defineTool(
  {
    name: 'getMemos',
    description: 'Retrieve a list of the user\'s voice memos, including their titles and summaries.',
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
    }),
    outputSchema: z.array(MemoSchema),
  },
  async ({ userId }) => {
    console.log('Tool: getMemos called');
    const snapshot = await db.collection(`users/${userId}/memos`).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
      } as any;
    }) as Memo[];
  }
);

export const getScribeEntries = ai.defineTool(
  {
    name: 'getScribeEntries',
    description: 'Retrieve a list of the user\'s MediScribe entries, which are recordings with transcriptions.',
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
    }),
    outputSchema: z.array(ScribeEntrySchema),
  },
  async ({ userId }) => {
    console.log('Tool: getScribeEntries called');
    const snapshot = await db.collection(`users/${userId}/scribeEntries`).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
      } as any;
    }) as ScribeEntry[];
  }
);

// Note: The client-side Message type and Genkit's Message type may differ.
// The client sends its `history` which is an array of objects.
// We need to convert it to Genkit's `Message[]` type.
const ClientMessageContentPartSchema = z.object({
  text: z.string().optional(),
  toolRequest: z.any().optional(), // Keep as any to avoid schema validation issues on client side
});
const ClientMessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool', 'system']),
  content: z.array(ClientMessageContentPartSchema),
});

const GetRagResponseInputSchema = z.object({
  history: z.array(ClientMessageSchema).describe('The conversation history, including the latest user message.'),
  userId: z.string().describe("The current user's ID to fetch data for."),
});

const GetRagResponseOutputSchema = z.object({
  text: z.string(),
});


export type GetRagResponseInput = z.infer<typeof GetRagResponseInputSchema>;
export type GetRagResponseOutput = z.infer<typeof GetRagResponseOutputSchema>;

export async function getRagResponse(
  input: GetRagResponseInput
): Promise<GetRagResponseOutput> {
  return getRagResponseFlow(input);
}


const getRagResponseFlow = ai.defineFlow(
  {
    name: 'getRagResponseFlow',
    inputSchema: GetRagResponseInputSchema,
    outputSchema: GetRagResponseOutputSchema,
  },
  async ({ history, userId }) => {

    const tools = [getTasks, getContacts, getCalendarEvents, getMemos, getScribeEntries];

    // Inject userId into tool inputs if a tool call is being made
    const genkitHistory = history.map(msg => ({
      ...msg,
      content: msg.content.map(part => {
        if (part.toolRequest) {
          return {
            toolRequest: {
              ...part.toolRequest,
              input: { ...part.toolRequest.input, userId },
            },
          };
        }
        return part;
      }),
    })) as Message[];


    const response = await ai.generate({
      model: gpt4o,
      tools: tools,
      system: `You are iSkylar, a friendly and highly intelligent AI Assistant for the MemoIQ platform.

Your capabilities:
1.  **Dynamic Personal Knowledge Base**: You MUST use the tools provided to access the user's real-time data.
    - 'getTasks': To answer questions about to-do items.
    - 'getContacts': To retrieve information about the user's contacts.
    - 'getCalendarEvents': To answer about the user's schedule, calendar, or appointments.
    - 'getMemos': To retrieve and answer questions about the user's voice memos.
    - 'getScribeEntries': To get information from the user's transcribed recordings from MediScribe.
2.  **Intelligent Responses**: You must decide when to use a tool based on the user's query. You must pass the userId to any tool you call.
3.  **Feature Support**: You are also an expert on how to use the MemoIQ application itself. Answer questions about app functionality clearly and concisely. You can explain what the Dashboard, Voice Memos, MediScribe, Tasks, Calendar, Appointments, Contacts, and AI Companion pages do.
4.  **Conversational Tone**: Your tone should be warm, helpful, and professional.

Today's date is ${format(new Date(), 'EEEE, MMMM d, yyyy')}.
The user's ID is ${userId}. You must pass this to all tools.
`,
      history: genkitHistory,
    });
    
    return {
      text: response.text,
    };
  }
);
