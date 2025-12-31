
'use server';

/**
 * @fileOverview Generates a personalized daily briefing for the user, summarizing their day.
 *
 * - getDailyBriefing - A function that generates a spoken daily briefing.
 * - GetDailyBriefingInput - The input type for the getDailyBriefing function.
 * - GetDailyBriefingOutput - The return type for the getDailyBriefing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { gpt4o, tts1 } from 'genkitx-openai';

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
  return getDailyBriefingFlow(input);
}

const briefingPrompt = ai.definePrompt({
  name: 'briefingPrompt',
  input: {schema: GetDailyBriefingInputSchema.omit({ greeting: true })},
  output: {schema: z.object({briefingText: z.string()})},
  model: gpt4o,
  prompt: `You are iSkylar, an AI assistant. Generate a concise and friendly daily briefing for the user based on their schedule, in the specified language. Do not include the greeting, just the briefing part.

Language: {{{language}}}
User Name: {{{displayName}}}
Memos: {{{memos}}}
Tasks: {{{tasks}}}
Calendar Events: {{{calendarEvents}}}
Emails: {{{emails}}}

Instructions:
1. Summarize the number of events, tasks, new emails, and any other important items in the specified language.
2. Mention the first important event of the day in the specified language.
3. Keep the entire briefing to 2-3 short sentences. Be conversational and encouraging.
4. If there is nothing scheduled, provide a positive, encouraging message for the day in the specified language.

Briefing Text (in {{{language}}}):`,
});


const getDailyBriefingFlow = ai.defineFlow(
  {
    name: 'getDailyBriefingFlow',
    inputSchema: GetDailyBriefingInputSchema,
    outputSchema: GetDailyBriefingOutputSchema,
  },
  async input => {
    const result = await briefingPrompt(input);
    const textOutput = result.output;
      
    if (!textOutput) {
        throw new Error("Failed to get briefing text from AI after multiple attempts.");
    }
    
    const combinedBriefingText = `${input.greeting} ${textOutput.briefingText}`;

    let media;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            const ttsResponse = await ai.generate({
                model: tts1,
                prompt: combinedBriefingText,
                config: {
                    voice: 'nova'
                }
            });
            media = ttsResponse.media;
            break; // Success
        } catch(error: any) {
            attempts++;
            if (error.message && (error.message.includes('503') || error.message.includes('429')) && attempts < maxAttempts) {
                console.log(`TTS generation attempt ${attempts} failed, retrying...`);
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
            } else {
                throw error;
            }
        }
    }

    if (!media) {
      throw new Error('no media returned');
    }

    const briefingAudioDataUri = media.url;
    
    return {
      briefingText: combinedBriefingText,
      briefingAudioDataUri,
    };
  }
);
