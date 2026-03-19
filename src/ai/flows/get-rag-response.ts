
'use server';
/**
 * @fileOverview A RAG-based AI assistant that can answer questions based on user data.
 *
 * - getRagResponse - A function that returns a response from the AI assistant.
 * - GetRagResponseInput - The input type for the getRagResponse function.
 * - GetRagResponseOutput - The return type for the getRagResponse function.
 */

import { z } from 'zod';
import { TaskSchema, ContactSchema, CalendarEventSchema, MemoSchema, ScribeEntrySchema } from '@/lib/data';
import { format } from 'date-fns';
import { getServerFirebase } from '@/firebase/server';

const { firestore: db } = getServerFirebase();

// Tools are now managed in agent-graph.ts

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

import { runAgent } from '@/ai/agent-graph';

export async function getRagResponse(
  input: GetRagResponseInput
): Promise<GetRagResponseOutput> {
  const { history, userId } = input;

  // Convert client-style history to LangChain message format
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : msg.role,
    content: msg.content.map(part => part.text || '').join('\n')
  }));

  try {
    const result = await runAgent(formattedHistory, userId);
    return {
      text: result.text
    };
  } catch (error: any) {
    console.error('Error in getRagResponse:', error);
    return {
      text: "I'm sorry, I encountered an error while processing your request. Please try again."
    };
  }
}
