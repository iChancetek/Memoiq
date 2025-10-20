
'use server';

/**
 * @fileOverview Retrieves personalized insights and reminders based on memos, tasks, and calendar events.
 *
 * - getPersonalizedInsights - A function that generates personalized insights for the user.
 * - PersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - PersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import { gpt4o } from 'genkitx-openai';
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
  const result = await getPersonalizedInsightsFlow(input);
  return {insights: result.insights};
}

const getPersonalizedInsightsFlow = ai.defineFlow(
  {
    name: 'getPersonalizedInsightsFlow',
    inputSchema: PersonalizedInsightsInputSchema,
    outputSchema: PersonalizedInsightsOutputSchema,
  },
  async ({memos, tasks, calendarEvents}) => {
    const prompt = `
      You are an AI assistant that provides personalized insights and reminders based on the user's memos, tasks, and calendar events.

      Memos:
      ${memos}

      Tasks:
      ${tasks}

      Calendar Events:
      ${calendarEvents}

      Generate a few key insights or reminders for the user.
    `;
    const llmResponse = await ai.generate({
      model: gpt4o,
      prompt: prompt,
      output: {
        schema: PersonalizedInsightsOutputSchema,
      },
    });

    return llmResponse.output!;
  }
);
