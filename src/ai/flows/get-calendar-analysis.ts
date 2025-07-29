'use server';
/**
 * @fileOverview Analyzes a user's calendar and tasks to provide strategic insights.
 *
 * - getCalendarAnalysis - A function that generates a high-level analysis of the user's schedule.
 * - GetCalendarAnalysisInput - The input type for the getCalendarAnalysis function.
 * - GetCalendarAnalysisOutput - The return type for the getCalendarAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCalendarAnalysisInputSchema = z.object({
  calendarEvents: z.string().describe("A JSON string of the user's calendar events, including title and time."),
  tasks: z.string().describe("A JSON string of the user's tasks, including title and due date."),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetCalendarAnalysisInput = z.infer<typeof GetCalendarAnalysisInputSchema>;

const GetCalendarAnalysisOutputSchema = z.object({
  summary: z.string().describe("A brief, high-level summary of the user's schedule for the next 7 days."),
  busyPeriods: z.array(z.string()).describe("A list of identified busy days or times (e.g., 'Wednesday afternoon is packed')."),
  suggestions: z.array(z.string()).describe("A list of 2-3 actionable suggestions to optimize the schedule."),
});
export type GetCalendarAnalysisOutput = z.infer<typeof GetCalendarAnalysisOutputSchema>;

export async function getCalendarAnalysis(
  input: GetCalendarAnalysisInput
): Promise<GetCalendarAnalysisOutput> {
  return getCalendarAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCalendarAnalysisPrompt',
  input: {schema: GetCalendarAnalysisInputSchema},
  output: {schema: GetCalendarAnalysisOutputSchema},
  prompt: `You are a world-class executive assistant and scheduling expert. Your goal is to analyze a user's calendar and task list to provide a strategic briefing for the upcoming week.

Current Date: {{{currentDate}}}

User's Calendar Events (JSON):
{{{calendarEvents}}}

User's Task List (JSON):
{{{tasks}}}

Instructions:
1.  **Summary**: Provide a concise, one-sentence summary of the upcoming 7 days. Mention any major themes or projects if they are apparent from event and task titles.
2.  **Identify Busy Periods**: Analyze the combined schedule of events and task due dates. Identify any days that are particularly crowded or have multiple significant deadlines. List these periods out.
3.  **Provide Actionable Suggestions**: Based on your analysis, generate a list of 2-3 concrete, actionable suggestions. These should be strategic tips, not just reminders. Examples: "Wednesday looks packed; consider blocking off focus time on Tuesday to prepare for your meetings," or "Since you have a major proposal due Friday, try to move your 1:1 with Sarah to the following week."

Analyze the provided data and generate the structured output.`,
});

const getCalendarAnalysisFlow = ai.defineFlow(
  {
    name: 'getCalendarAnalysisFlow',
    inputSchema: GetCalendarAnalysisInputSchema,
    outputSchema: GetCalendarAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
