'use server';
/**
 * @fileOverview Generates a personalized voice greeting for the user upon login.
 *
 * - getWelcomeGreeting - A function that creates a text and audio greeting.
 * - GetWelcomeGreetingInput - The input type for the getWelcomeGreeting function.
 * - GetWelcomeGreetingOutput - The return type for the getWelcomeGreeting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWelcomeGreetingInputSchema = z.object({
  displayName: z.string().describe("The user's first name or display name."),
});
export type GetWelcomeGreetingInput = z.infer<typeof GetWelcomeGreetingInputSchema>;

const GetWelcomeGreetingOutputSchema = z.object({
  text: z.string().describe('The welcome message text.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the greeting as a base64-encoded data URI. This is currently non-functional and will be an empty string.'),
});
export type GetWelcomeGreetingOutput = z.infer<typeof GetWelcomeGreetingOutputSchema>;

export async function getWelcomeGreeting(
  input: GetWelcomeGreetingInput
): Promise<GetWelcomeGreetingOutput> {
  return getWelcomeGreetingFlow(input);
}

const getWelcomeGreetingFlow = ai.defineFlow(
  {
    name: 'getWelcomeGreetingFlow',
    inputSchema: GetWelcomeGreetingInputSchema,
    outputSchema: GetWelcomeGreetingOutputSchema,
  },
  async ({ displayName }) => {
    const greetingText = `Welcome back, ${displayName}. Let's get started with your day.`;

    // Audio generation is currently disabled to fix system instability.
    const audioDataUri = '';

    return {
      text: greetingText,
      audioDataUri,
    };
  }
);
