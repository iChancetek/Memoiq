'use server';
/**
 * @fileOverview Generates a personalized voice greeting for the user upon login.
 *
 * - getWelcomeGreeting - A function that creates a text and audio greeting.
 * - GetWelcomeGreetingInput - The input type for the getWelcomeGreeting function.
 * - GetWelcomeGreetingOutput - The return type for the getWelcomeGreeting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GetWelcomeGreetingInputSchema = z.object({
  displayName: z.string().describe("The user's first name or display name."),
});
export type GetWelcomeGreetingInput = z.infer<typeof GetWelcomeGreetingInputSchema>;

const GetWelcomeGreetingOutputSchema = z.object({
  text: z.string().describe('The welcome message text.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the greeting as a base64-encoded data URI.'),
});
export type GetWelcomeGreetingOutput = z.infer<typeof GetWelcomeGreetingOutputSchema>;

export async function getWelcomeGreeting(
  input: GetWelcomeGreetingInput
): Promise<GetWelcomeGreetingOutput> {
  return getWelcomeGreetingFlow(input);
}

const getWelcomeGreetingFlow = ai.defineFlow(
  {
    name: 'getWelcomeGreetingFlow',
    inputSchema: GetWelcomeGreetingInputSchema,
    outputSchema: GetWelcomeGreetingOutputSchema,
  },
  async ({ displayName }) => {
    const greetingText = `Welcome back, ${displayName}. Let's get started with your day.`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Using a friendly, natural female voice as requested.
            prebuiltVoiceConfig: { voiceName: 'Umbriel' },
          },
        },
      },
      prompt: greetingText,
    });
    
    if (!media) {
      throw new Error('No audio media returned from TTS model for the greeting.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavData = await toWav(audioBuffer);
    const audioDataUri = 'data:audio/wav;base64,' + wavData;

    return {
      text: greetingText,
      audioDataUri,
    };
  }
);

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

    const bufs: any[] = [];
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
