'use server';

/**
 * @fileOverview Retrieves personalized insights and reminders based on memos, tasks, and calendar events.
 *
 * - getPersonalizedInsights - A function that generates personalized insights for the user.
 * - PersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - PersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedInsightsInputSchema = z.object({
  memos: z.string().describe('User memos.'),
  tasks: z.string().describe('User tasks.'),
  calendarEvents: z.string().describe('User calendar events.'),
});
export type PersonalizedInsightsInput = z.infer<
  typeof PersonalizedInsightsInputSchema
>;

const PersonalizedInsightsOutputSchema = z.object({
  insights: z.string().describe('Personalized insights and reminders.'),
});
export type PersonalizedInsightsOutput = z.infer<
  typeof PersonalizedInsightsOutputSchema
>;

export async function getPersonalizedInsights(
  input: PersonalizedInsightsInput
): Promise<PersonalizedInsightsOutput> {
  return getPersonalizedInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedInsightsPrompt',
  input: {schema: PersonalizedInsightsInputSchema},
  output: {schema: PersonalizedInsightsOutputSchema},
  model: 'googleai/gemini-1.5-pro-preview-0514',
  prompt: `You are iSkylar, an AI assistant that provides personalized insights and reminders to users based on their memos, tasks, and calendar events.

  Analyze the following information and provide personalized insights and reminders to help the user stay organized and focused on their priorities.

Memos: {{{memos}}}
Tasks: {{{tasks}}}
Calendar Events: {{{calendarEvents}}}

Insights:`,
});

const getPersonalizedInsightsFlow = ai.defineFlow(
  {
    name: 'getPersonalizedInsightsFlow',
    inputSchema: PersonalizedInsightsInputSchema,
    outputSchema: PersonalizedInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
