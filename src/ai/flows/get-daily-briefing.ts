
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
import wav from 'wav';

const GetDailyBriefingInputSchema = z.object({
  greeting: z.string().describe("The user's personalized greeting."),
  displayName: z.string().describe("The user's display name."),
  memos: z.string().describe('A JSON string of recent user memos.'),
  tasks: z.string().describe('A JSON string of user tasks for today.'),
  calendarEvents: z.string().describe('A JSON string of user calendar events for today.'),
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
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are iSkylar, an AI assistant. Generate a concise and friendly daily briefing for the user based on their schedule, in the specified language. Do not include the greeting, just the briefing part.

Language: {{{language}}}
User Name: {{{displayName}}}
Memos: {{{memos}}}
Tasks: {{{tasks}}}
Calendar Events: {{{calendarEvents}}}

Instructions:
1. Summarize the number of events, tasks, and any other important items in the specified language.
2. Mention the first important event of the day in the specified language.
3. Keep the entire briefing to 2-3 short sentences. Be conversational and encouraging.
4. If there is nothing scheduled, provide a positive, encouraging message for the day in the specified language.

Briefing Text (in {{{language}}}):`,
});

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });
    writer.write(pcmData);
    writer.end();
  });
}

const getDailyBriefingFlow = ai.defineFlow(
  {
    name: 'getDailyBriefingFlow',
    inputSchema: GetDailyBriefingInputSchema,
    outputSchema: GetDailyBriefingOutputSchema,
  },
  async input => {
    let textOutput;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const result = await briefingPrompt(input);
            textOutput = result.output;
            break; // Success, exit loop
        } catch (error: any) {
            attempts++;
            if (error.message.includes('503') && attempts < maxAttempts) {
                console.log(`Attempt ${attempts} failed with 503, retrying after delay...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts))); // Exponential backoff
            } else {
                throw error; // Rethrow other errors or if max attempts reached
            }
        }
    }
      
    if (!textOutput) {
        throw new Error("Failed to get briefing text from AI after multiple attempts.");
    }
    
    const combinedBriefingText = `${input.greeting} ${textOutput.briefingText}`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: combinedBriefingText,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const briefingAudioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
    
    return {
      briefingText: combinedBriefingText,
      briefingAudioDataUri,
    };
  }
);
