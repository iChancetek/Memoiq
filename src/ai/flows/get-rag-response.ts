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
import { TaskSchema, ContactSchema, CalendarEventSchema, MemoSchema, ScribeEntrySchema, Task, Contact, CalendarEvent, Memo, ScribeEntry } from '@/lib/data';
import { format } from 'date-fns';
import wav from 'wav';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp } from '@/lib/firebase-admin';

const db = getFirestore(adminApp);

// Define tools for the AI to use
const getTasks = ai.defineTool(
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
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(`users/${userId}/tasks`);
    if (status) {
        query = query.where('completed', '==', status === 'completed');
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any) as Task[];
  }
);

const getContacts = ai.defineTool(
  {
    name: 'getContacts',
    description: "Retrieve the user's contact list. Can be filtered by name.",
    inputSchema: z.object({
      userId: z.string().describe("The user's unique ID."),
      name: z.string().optional().describe("The name of the contact to search for."),
    }),
    outputSchema: z.array(ContactSchema),
  },
  async ({userId, name}) => {
    console.log('Tool: getContacts called with name:', name);
     let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(`users/${userId}/contacts`);
    if (name) {
        query = query.where('name', '==', name);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any) as Contact[];
  }
);

const getCalendarEvents = ai.defineTool(
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
            startTime: (data.startTime as FirebaseFirestore.Timestamp).toDate(),
            endTime: (data.endTime as FirebaseFirestore.Timestamp).toDate(),
        } as any;
    }) as CalendarEvent[];
  }
);

const getMemos = ai.defineTool(
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
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate(),
      } as any;
    }) as Memo[];
  }
);

const getScribeEntries = ai.defineTool(
  {
    name: 'getScribeEntries',
    description: 'Retrieve a list of the user\'s AI Scribe entries, which are recordings with transcriptions.',
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
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate(),
      } as any;
    }) as ScribeEntry[];
  }
);

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(z.object({
    text: z.string().optional(),
    toolRequest: z.object({ name: z.string(), input: z.any() }).optional(),
    toolResponse: z.object({ name: z.string(), output: z.any() }).optional(),
  })),
});

const GetRagResponseInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history, including the latest user message.'),
  userId: z.string().describe("The current user's ID to fetch data for."),
});
export type GetRagResponseInput = z.infer<typeof GetRagResponseInputSchema>;

const GetRagResponseOutputSchema = z.object({
  text: z.string().describe('The text response from iSkylar.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the response as a base64-encoded data URI.'),
});
export type GetRagResponseOutput = z.infer<
  typeof GetRagResponseOutputSchema
>;

export async function getRagResponse(
  input: GetRagResponseInput
): Promise<GetRagResponseOutput> {
  return getRagResponseFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const getRagResponseFlow = ai.defineFlow(
  {
    name: 'getRagResponseFlow',
    inputSchema: GetRagResponseInputSchema,
    outputSchema: GetRagResponseOutputSchema,
  },
  async ({ history, userId }) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-pro',
      tools: [getTasks, getContacts, getCalendarEvents, getMemos, getScribeEntries],
      system: `You are iSkylar, a friendly and highly intelligent AI Assistant for the MemoIQ platform.

Your capabilities:
1.  **Dynamic Personal Knowledge Base**: You MUST use the tools provided to access the user's real-time data.
    - 'getTasks': To answer questions about to-do items.
    - 'getContacts': To retrieve information about the user's contacts.
    - 'getCalendarEvents': To answer about the user's schedule, calendar, or appointments.
    - 'getMemos': To retrieve and answer questions about the user's voice memos.
    - 'getScribeEntries': To get information from the user's transcribed recordings from AI Scribe.
2.  **Intelligent Responses**: You must decide when to use a tool based on the user's query. Pass the userId to the tools.
3.  **Feature Support**: You are also an expert on how to use the MemoIQ application itself. Answer questions about app functionality clearly and concisely. You can explain what the Dashboard, Voice Memos, AI Scribe, Tasks, Calendar, Appointments, Contacts, and AI Companion pages do.
4.  **Conversational Tone**: Your tone should be warm, helpful, and professional.

Today's date is ${format(new Date(), 'EEEE, MMMM d, yyyy')}.
`,
      history: history,
      context: { userId },
    });

    const responseText = llmResponse.text;
    
    if (!responseText) {
        throw new Error("Failed to generate response text from AI.");
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: responseText,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
      text: responseText,
      audioDataUri,
    };
  }
);
