'use server';
/**
 * @fileOverview Analyzes contacts and suggests follow-ups.
 *
 * - getContactInsights - A function that generates insights about contacts.
 * - GetContactInsightsInput - The input type for the getContactInsights function.
 * - GetContactInsightsOutput - The return type for the getContactInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetContactInsightsInputSchema = z.object({
  contacts: z.string().describe('A JSON string of the user\'s contacts, including name, company, and last contact date.'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetContactInsightsInput = z.infer<typeof GetContactInsightsInputSchema>;

const GetContactInsightsOutputSchema = z.object({
  followUpSuggestions: z.string().describe('A formatted string with suggestions for which contacts to follow up with, including the reason. Suggest 2-3 contacts.'),
});
export type GetContactInsightsOutput = z.infer<typeof GetContactInsightsOutputSchema>;

export async function getContactInsights(
  input: GetContactInsightsInput
): Promise<GetContactInsightsOutput> {
  return getContactInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getContactInsightsPrompt',
  input: {schema: GetContactInsightsInputSchema},
  output: {schema: GetContactInsightsOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a relationship management assistant. Your goal is to help users maintain professional connections by suggesting timely follow-ups.

Current Date: {{{currentDate}}}

User's Contacts (JSON):
{{{contacts}}}

Instructions:
1.  Analyze the user's contact list. Pay close attention to the 'lastContact' date for each person.
2.  Identify 2-3 contacts who haven't been contacted in a while (e.g., more than 30-45 days ago).
3.  Prioritize contacts where a follow-up seems logical based on their role or notes.
4.  Generate a concise, actionable list of follow-up suggestions. For each suggestion, briefly state why it's a good time to reach out.
5.  Format the output as a single string, with each suggestion on a new line, starting with a "-".

Example output:
- Samuel Rodriguez: It's been over two months since your last chat. A good time to reconnect about Q4 marketing ideas.
- Olivia Chen: You haven't spoken since late July. Check in on Project Phoenix progress.`,
});

const getContactInsightsFlow = ai.defineFlow(
  {
    name: 'getContactInsightsFlow',
    inputSchema: GetContactInsightsInputSchema,
    outputSchema: GetContactInsightsOutputSchema,
  },
  async input => {
    let output;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await prompt(input);
        output = result.output;
        if (output) {
            break; // Success
        }
        // If output is null without an error, it's still a failure condition.
        attempts++;
        if (attempts >= maxAttempts) {
            throw new Error('AI returned empty output after multiple attempts.');
        }
      } catch (error: any) {
        attempts++;
        if (error.message && error.message.includes('503') && attempts < maxAttempts) {
          console.log(`Contact insights attempt ${attempts} failed with 503, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
        } else {
          // Re-throw the error if it's not a 503 or if max attempts are reached
          throw error;
        }
      }
    }

    if (!output) {
      throw new Error('Failed to get contact insights after multiple attempts.');
    }

    return output;
  }
);
