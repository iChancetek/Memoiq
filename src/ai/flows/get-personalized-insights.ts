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
export type PersonalizedInsightsOutput = z.infe...