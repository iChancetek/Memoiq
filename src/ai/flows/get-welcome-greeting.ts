
'use server';
/**
 * @fileOverview Generates a personalized, time-aware voice greeting for the user.
 *
 * - getWelcomeGreetingText - A function that creates a text greeting.
 * - GetWelcomeGreetingInput - The input type for the getWelcomeGreetingText function.
 * - GetWelcomeGreetingOutput - The return type for the getWelcomeGreetingText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWelcomeGreetingInputSchema = z.object({
  displayName: z.string().describe("The user's first name or display name."),
  hour: z.number().describe('The current hour (0-23) in the user\'s local time.'),
});
export type GetWelcomeGreetingInput = z.infer<typeof GetWelcomeGreetingInputSchema>;


export async function getWelcomeGreetingText(
  input: GetWelcomeGreetingInput
): Promise<string> {
  return getWelcomeGreetingFlow(input);
}

const getGreetingText = (name: string, hour: number) => {
    if (hour >= 5 && hour < 12) {
        return `Good morning, ${name}.`;
    }
    if (hour >= 12 && hour < 18) {
        return `Good afternoon, ${name}.`;
    }
    if (hour >= 18 && hour < 22) {
        return `Good evening, ${name}.`;
    }
    return `Hello, ${name}. I hope you’re winding down for the night.`;
}

const getWelcomeGreetingFlow = ai.defineFlow(
  {
    name: 'getWelcomeGreetingFlow',
    inputSchema: GetWelcomeGreetingInputSchema,
    outputSchema: z.string(),
  },
  async ({ displayName, hour }) => {
    return getGreetingText(displayName, hour);
  }
);
