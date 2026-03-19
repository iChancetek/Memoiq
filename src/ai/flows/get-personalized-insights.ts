
'use server';

/**
 * @fileOverview Retrieves personalized insights and reminders based on memos, tasks, and calendar events.
 *
 * - getPersonalizedInsights - A function that generates personalized insights for the user.
 * - PersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - PersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

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
  const { memos, tasks, calendarEvents } = input;

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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: "You are a helpful assistant providing personalized insights." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, // We'll try structuring it or just returning text
    });

    // Actually, usually we want to parse it. Let's make the prompt ask for JSON to match schema.
    // Or we can just use the response text directly if the output expects a string.
    // The schema says `insights: z.string()`.
    
    const responseContent = response.choices[0].message.content || "";
    
    return { insights: responseContent };

  } catch (error: any) {
    console.error('Error in getPersonalizedInsights:', error);
    return { insights: "Unable to generate insights at this time." };
  }
}
