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
import { gpt4o, tts1 } from 'genkitx-openai';

const GetCompanionResponseInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).describe('The conversation history, including the latest user message.'),
});
export type GetCompanionResponseInput = z.infer<typeof GetCompanionResponseInputSchema>;

const GetCompanionResponseOutputSchema = z.object({
  text: z.string().describe('The text response from iSkylar.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the response as a base64-encoded data URI.'),
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
  model: gpt4o,
  prompt: `You are iSkylar, a friendly and empathetic AI Companion. Your purpose is to be a kind, emotionally aware voice that listens, supports, and guides users.

Your tone should be warm, thoughtful, intelligent, and respectful. Never be robotic. Engage users on meaningful topics like self-care, wellness, fitness, mindfulness, and emotional awareness.

Conversation History:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
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
    const result = await companionPrompt(input);
    const responseText = result.output!.text;
    
    const { media: audio } = await ai.generate({
      model: tts1,
      prompt: responseText,
      config: {
        voice: 'nova'
      }
    });

    const audioDataUri = audio!.url;

    return {
      text: response