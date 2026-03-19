'use server';
/**
 * @fileOverview Analyzes a user's appointments to provide strategic insights.
 *
 * - getAppointmentAnalysis - A function that generates a high-level analysis of upcoming appointments.
 * - GetAppointmentAnalysisInput - The input type for the getAppointmentAnalysis function.
 * - GetAppointmentAnalysisOutput - The return type for the getAppointmentAnalysis function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const GetAppointmentAnalysisInputSchema = z.object({
  calendarEvents: z.string().describe("A JSON string of the user's calendar events for the next 7 days."),
  contacts: z.string().describe("A JSON string of the user's contacts to provide context."),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetAppointmentAnalysisInput = z.infer<typeof GetAppointmentAnalysisInputSchema>;

const GetAppointmentAnalysisOutputSchema = z.object({
  summary: z.string().describe("A brief, high-level summary of the upcoming week's appointments."),
  schedulingRisks: z.array(z.string()).describe("A list of identified potential issues."),
  proactiveSuggestions: z.array(z.string()).describe("A list of 2-3 actionable suggestions."),
  audioDataUri: z.string().describe('The text-to-speech audio of the analysis as a base64-encoded data URI.'),
});
export type GetAppointmentAnalysisOutput = z.infer<typeof GetAppointmentAnalysisOutputSchema>;

export async function getAppointmentAnalysis(
  input: GetAppointmentAnalysisInput
): Promise<GetAppointmentAnalysisOutput> {
  const { calendarEvents, contacts, currentDate } = input;

  try {
    // 1. Generate Analysis Text
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content: "You are an expert executive assistant. Analyze the user's upcoming appointments and provide a strategic briefing in JSON format."
        },
        {
          role: "user",
          content: `Current Date: ${currentDate}\nCalendar Events: ${calendarEvents}\nContacts: ${contacts}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    const summary = parsed.summary || "No appointments found.";
    const schedulingRisks = parsed.schedulingRisks || [];
    const proactiveSuggestions = parsed.proactiveSuggestions || [];

    const readableAnalysis = `Here is your appointment analysis. Summary: ${summary}. Risks: ${schedulingRisks.join(', ') || 'None'}. Suggestions: ${proactiveSuggestions.join('. ')}.`;

    // 2. Generate TTS Audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: readableAnalysis,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    return {
      summary,
      schedulingRisks,
      proactiveSuggestions,
      audioDataUri,
    };
  } catch (error: any) {
    console.error('Error in getAppointmentAnalysis:', error);
    return {
      summary: "Error generating analysis.",
      schedulingRisks: [],
      proactiveSuggestions: [],
      audioDataUri: "",
    };
  }
}
