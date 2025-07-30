'use server';
/**
 * @fileOverview Generates a personalized, time-aware voice greeting for the user.
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
  hour: z.number().describe('The current hour (0-23) in the user\'s local time.'),
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

const getGreetingText = (name: string, hour: number) => {
    if (hour >= 5 && hour < 12) {
        return `Good morning, ${name}.`;
    }
    if (hour >= 12 && hour < 18) {
        return `Good afternoon, ${name}.`;
    }
    if (hour >= 18 && hour < 22) {
        return `Good evening, ${name}.`;
    }
    return `Hello, ${name}. I hope you’re winding down for the night.`;
}

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

    let bufs = [] as any[];
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

const getWelcomeGreetingFlow = ai.defineFlow(
  {
    name: 'getWelcomeGreetingFlow',
    inputSchema: GetWelcomeGreetingInputSchema,
    outputSchema: GetWelcomeGreetingOutputSchema,
  },
  async ({ displayName, hour }) => {
    const greetingText = getGreetingText(displayName, hour);

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
      prompt: greetingText,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
      text: greetingText,
      audioDataUri,
    };
  }
);
