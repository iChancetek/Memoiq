
'use server';
/**
 * @fileOverview Generates a personalized, time-aware voice greeting for the user.
 *
 * - getWelcomeGreetingText - A function that creates a text greeting.
 * - GetWelcomeGreetingInput - The input type for the getWelcomeGreetingText function.
 * - GetWelcomeGreetingOutput - The return type for the getWelcomeGreetingText function.
 */

import { z } from 'zod';

const GetWelcomeGreetingInputSchema = z.object({
  displayName: z.string().describe("The user's first name or display name."),
  hour: z.number().describe('The current hour (0-23) in the user\'s local time.'),
});
export type GetWelcomeGreetingInput = z.infer<typeof GetWelcomeGreetingInputSchema>;

export async function getWelcomeGreetingText(
  input: GetWelcomeGreetingInput
): Promise<string> {
    const { displayName, hour } = input;
    if (hour >= 5 && hour < 12) {
        return `Good morning, ${displayName}.`;
    }
    if (hour >= 12 && hour < 18) {
        return `Good afternoon, ${displayName}.`;
    }
    if (hour >= 18 && hour < 22) {
        return `Good evening, ${displayName}.`;
    }
    return `Hello, ${displayName}. I hope you’re winding down for the night.`;
}
