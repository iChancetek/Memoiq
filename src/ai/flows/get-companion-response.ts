'use server';
/**
 * @fileOverview Generates empathetic responses for the AI Companion, iSkylar.
 *
 * - getCompanionResponse - A function that creates a conversational response from iSkylar.
 * - GetCompanionResponseInput - The input type for the getCompanionResponse function.
 * - GetCompanionResponseOutput - The return type for the getCompanionResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCompanionResponseInputSchema = z.object({
  message: z.string().describe('The user\'s message to iSkylar.'),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).describe('The conversation history.'),
});
export type GetCompanionResponseInput = z.infer<typeof GetCompanionResponseInputSchema>;

const GetCompanionResponseOutputSchema = z.object({
  text: z.string().describe('The text response from iSkylar.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the response as a base64-encoded data URI. This is currently non-functional and will be an empty string.'),
});
export type GetCompanionResponseOutput = z.infer<typeof GetCompanionResponseOutputSchema>;

export async function getCompanionResponse(
  input: GetCompanionResponseInput
): Promise<GetCompanionResponseOutput> {
  return getCompanionResponseFlow(input);
}

const companionPrompt = ai.definePrompt({
  name: 'companionPrompt',
  input: {schema: GetCompanionResponseInputSchema},
  output: {schema: z.object({text: z.string()})},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are iSkylar, a friendly and empathetic AI Companion. Your purpose is to be a kind, emotionally aware voice that listens, supports, and guides users.

Your tone should be warm, thoughtful, intelligent, and respectful. Never be robotic. Engage users on meaningful topics like self-care, wellness, fitness, mindfulness, and emotional awareness.

Current conversation:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
user: {{{message}}}
assistant:`,
});

const getCompanionResponseFlow = ai.defineFlow(
  {
    name: 'getCompanionResponseFlow',
    inputSchema: GetCompanionResponseInputSchema,
    outputSchema: GetCompanionResponseOutputSchema,
  },
  async (input) => {
    // Generate the text response
    const {output: textOutput} = await companionPrompt(input);
    const responseText = textOutput!.text;

    // Audio generation is currently disabled to fix system instability.
    const audioDataUri = '';

    return {
      text: responseText,
      audioDataUri,
    };
  }
);
