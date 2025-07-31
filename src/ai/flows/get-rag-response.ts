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
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {firebaseApp} from '@/lib/firebase';
import {Task, Contact, CalendarEvent} from '@/lib/data';
import {format} from 'date-fns';
import wav from 'wav';

const db = getFirestore(firebaseApp);

// Define tools for the AI to use
const getTasks = ai.defineTool(
  {
    name: 'getTasks',
    description: 'Retrieve a list of the user\'s tasks. Can be filtered by status (e.g., "completed", "pending").',
    inputSchema: z.object({
      status: z.enum(['completed', 'pending']).optional().describe('The status of tasks to retrieve.'),
    }),
    outputSchema: z.array(z.custom<Task>()),
  },
  async ({status}) => {
    // This is a placeholder. In a real app, you'd fetch this for the logged-in user.
    // This example uses mock data for simplicity.
    console.log('Tool: getTasks called with status:', status);
    const q = query(
      collection(db, 'tasks'), // Simplified for example
      status ? where('completed', '==', status === 'completed') : where('completed', 'in', [true, false])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  }
);

const getContacts = ai.defineTool(
  {
    name: 'getContacts',
    description: "Retrieve the user's contact list. Can be filtered by name.",
    inputSchema: z.object({
      name: z.string().optional().describe("The name of the contact to search for."),
    }),
    outputSchema: z.array(z.custom<Contact>()),
  },
  async ({name}) => {
    console.log('Tool: getContacts called with name:', name);
    const q = query(
        collection(db, 'contacts'), // Simplified for example
        name ? where('name', '==', name) : where('name', '!=', '')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Contact);
  }
);

const getCalendarEvents = ai.defineTool(
  {
    name: 'getCalendarEvents',
    description: "Retrieve calendar events for a given date range. Default is today.",
    inputSchema: z.object({
        startDate: z.string().optional().describe("Start date in YYYY-MM-DD format."),
        endDate: z.string().optional().describe("End date in YYYY-MM-DD format."),
    }),
    outputSchema: z.array(z.custom<CalendarEvent>()),
  },
  async ({startDate, endDate}) => {
    console.log('Tool: getCalendarEvents called with:', {startDate, endDate});
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
    
    const q = query(
        collection(db, 'events'), // Simplified for example
        where('startTime', '>=', start),
        where('startTime', '<=', end)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CalendarEvent);
  }
);


const GetRagResponseInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .describe('The conversation history, including the latest user message.'),
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
1.  **Dynamic Personal Knowledge Base**: You have access to the user's real-time data through the tools provided (getTasks, getContacts, getCalendarEvents).
2.  **Intelligent Responses**: Use the available tools to answer user questions about their schedule, tasks, and contacts. You must decide when to use a tool based on the user's query. For example, if a user asks "What's on my schedule today?", you should use the getCalendarEvents tool.
3.  **Feature Support**: You are also an expert on how to use the MemoIQ application itself. Answer questions about app functionality clearly and concisely.
4.  **Conversational Tone**: Your tone should be warm, helpful, and professional.

Today's date is ${format(new Date(), 'EEEE, MMMM d, yyyy')}.

Conversation History:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
assistant:`,
  input: {schema: GetRagResponseInputSchema},
  output: {schema: z.object({ text: z.string() })},
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
  async input => {
    const {output} = await ragPrompt(input);
    const responseText = output!.text;

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
