
'use server';

/**
 * @fileOverview Generates a personalized daily briefing for the user, summarizing their day.
 *
 * - getDailyBriefing - A function that generates a spoken daily briefing.
 * - GetDailyBriefingInput - The input type for the getDailyBriefing function.
 * - GetDailyBriefingOutput - The return type for the getDailyBriefing function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const GetDailyBriefingInputSchema = z.object({
  greeting: z.string().describe("The user's personalized greeting."),
  displayName: z.string().describe("The user's display name."),
  memos: z.string().describe('A JSON string of recent user memos.'),
  tasks: z.string().describe('A JSON string of user tasks for today.'),
  calendarEvents: z.string().describe('A JSON string of user calendar events for today.'),
  emails: z.string().describe('A JSON string of recent user emails.'),
  language: z.enum(['en', 'es']).optional().default('en').describe('The language for the briefing.'),
});
export type GetDailyBriefingInput = z.infer<typeof GetDailyBriefingInputSchema>;

const GetDailyBriefingOutputSchema = z.object({
  briefingText: z.string().describe('The personalized text for the daily briefing.'),
  briefingAudioDataUri: z.string().describe('The text-to-speech audio of the briefing as a base64-encoded data URI.'),
});
export type GetDailyBriefingOutput = z.infer<typeof GetDailyBriefingOutputSchema>;

export async function getDailyBriefing(
  input: GetDailyBriefingInput
): Promise<GetDailyBriefingOutput> {
  const { displayName, memos, tasks, calendarEvents, emails, language, greeting } = input;

  try {
    // 1. Generate Briefing Text
    const textResponse = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content: `You are iSkylar, an AI assistant. Generate a concise and friendly daily briefing (2-3 short sentences) for the user based on their schedule. Do not include a greeting. Response language: ${language}. Output as a JSON object with a single key "briefingText".`
        },
        {
          role: "user",
          content: `User Name: ${displayName}\nMemos: ${memos}\nTasks: ${tasks}\nCalendar Events: ${calendarEvents}\nEmails: ${emails}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedText = JSON.parse(textResponse.choices[0].message.content || '{}');
    const briefingText = parsedText.briefingText || "I hope you have a great day!";
    const combinedText = `${greeting} ${briefingText}`;

    // 2. Generate TTS Audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: combinedText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const briefingAudioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    return {
      briefingText: combinedText,
      briefingAudioDataUri,
    };
  } catch (error: any) {
    console.error('Error in getDailyBriefing:', error);
    return {
      briefingText: "Error generating daily briefing.",
      briefingAudioDataUri: "",
    };
  }
}
