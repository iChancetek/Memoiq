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
import { TaskSchema, ContactSchema, CalendarEventSchema, Task, Contact, CalendarEvent } from '@/lib/data';
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
    description: "Retrieve calendar events for a given date range. Default is today.",
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

const PartSchema = z.object({
  text: z.string().optional(),
  toolRequest: z.object({
    name: z.string(),
    input: z.any(),
  }).optional(),
  toolResponse: z.object({
    name: z.string(),
    output: z.any(),
  }).optional(),
});

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(PartSchema),
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

const ragPrompt = ai.definePrompt({
  name: 'ragPrompt',
  model: 'googleai/gemini-1.5-pro',
  tools: [getTasks, getContacts, getCalendarEvents],
  system: `You are iSkylar, a friendly and highly intelligent AI Assistant for the MemoIQ platform.

Your capabilities:
1.  **Dynamic Personal Knowledge Base**: You have access to the user's real-time data through the tools provided (getTasks, getContacts, getCalendarEvents). You MUST pass the user's ID to these tools.
2.  **Intelligent Responses**: Use the available tools to answer user questions about their schedule, tasks, and contacts. You must decide when to use a tool based on the user's query. For example, if a user asks "What's on my schedule today?", you should use the getCalendarEvents tool.
3.  **Feature Support**: You are also an expert on how to use the MemoIQ application itself. Answer questions about app functionality clearly and concisely.
4.  **Conversational Tone**: Your tone should be warm, helpful, and professional.

Today's date is ${format(new Date(), 'EEEE, MMMM d, yyyy')}.`,
  output: {schema: z.object({text: z.string()})},
   input: {
    schema: z.object({
        userId: z.string(),
        history: z.array(MessageSchema),
    })
  }
});

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
     // The AI model doesn't know the userId, so we pass it in the prompt context.
    // Genkit will automatically provide this context to any tools that are called.
    const llmResponse = await ragPrompt({ history, userId });

    const responseText = llmResponse.output?.text;
    
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
