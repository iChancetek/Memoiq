'use server';
/**
 * @fileOverview Analyzes a user's appointments to provide strategic insights.
 *
 * - getAppointmentAnalysis - A function that generates a high-level analysis of upcoming appointments.
 * - GetAppointmentAnalysisInput - The input type for the getAppointmentAnalysis function.
 * - GetAppointmentAnalysisOutput - The return type for the getAppointmentAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { gpt4o, tts1 } from 'genkitx-openai';


const GetAppointmentAnalysisInputSchema = z.object({
  calendarEvents: z.string().describe("A JSON string of the user's calendar events for the next 7 days."),
  contacts: z.string().describe("A JSON string of the user's contacts to provide context."),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetAppointmentAnalysisInput = z.infer<typeof GetAppointmentAnalysisInputSchema>;

const GetAppointmentAnalysisOutputSchema = z.object({
  summary: z.string().describe("A brief, high-level summary of the upcoming week's appointments."),
  schedulingRisks: z.array(z.string()).describe("A list of identified potential issues, like back-to-back meetings or meetings without buffer time."),
  proactiveSuggestions: z.array(z.string()).describe("A list of 2-3 actionable suggestions, such as sending confirmations or preparing for meetings."),
  audioDataUri: z.string().describe('The text-to-speech audio of the analysis as a base64-encoded data URI.'),
});
export type GetAppointmentAnalysisOutput = z.infer<typeof GetAppointmentAnalysisOutputSchema>;

export async function getAppointmentAnalysis(
  input: GetAppointmentAnalysisInput
): Promise<GetAppointmentAnalysisOutput> {
  return getAppointmentAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAppointmentAnalysisPrompt',
  input: {schema: GetAppointmentAnalysisInputSchema},
  output: {schema: GetAppointmentAnalysisOutputSchema.omit({ audioDataUri: true })},
  model: gpt4o,
  prompt: `You are an expert executive assistant. Your goal is to analyze a user's upcoming appointments for the week and provide a strategic briefing.

Current Date: {{{currentDate}}}

User's Calendar Events (JSON):
{{{calendarEvents}}}

User's Contacts (JSON):
{{{contacts}}}

Instructions:
1.  **Summary**: Provide a concise, one-sentence summary of the upcoming 7 days of appointments. Mention any particularly important meetings.
2.  **Identify Scheduling Risks**: Analyze the appointment schedule for potential problems. Look for meetings scheduled back-to-back with no break, appointments early in the morning, or unusually long meetings. List these potential risks.
3.  **Provide Proactive Suggestions**: Based on the appointments, generate a list of 2-3 concrete, helpful suggestions. These could include reminders to send a confirmation email (cross-referencing the contacts list), suggestions to block out prep time before a big meeting, or advice to prepare an agenda.

Analyze the provided data and generate the structured output.`,
});


const getAppointmentAnalysisFlow = ai.defineFlow(
  {
    name: 'getAppointmentAnalysisFlow',
    inputSchema: GetAppointmentAnalysisInputSchema,
    outputSchema: GetAppointmentAnalysisOutputSchema,
  },
  async input => {
    const result = await prompt(input);
    const analysisOutput = result.output;
    
    if (!analysisOutput) {
      throw new Error('Failed to get appointment analysis after multiple attempts.');
    }

    const readableAnalysis = `
      Here is your appointment analysis.
      Summary: ${analysisOutput.summary}.
      Scheduling Risks: ${analysisOutput.schedulingRisks.join(', ') || 'None'}.
      Suggestions: ${analysisOutput.proactiveSuggestions.join('. ')}.
    `;

    const { media: audio } = await ai.generate({
      model: tts1,
      prompt: readableAnalysis,
      config: {
        voice: 'nova'
      }
    });

    const audioDataUri = audio!.url;

    return