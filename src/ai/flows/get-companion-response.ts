'use server';
/**
 * @fileOverview Generates empathetic responses and provides text-to-speech audio for the AI Companion, iSkylar.
 *
 * - getCompanionResponse - A function that creates a conversational response from iSkylar.
 * - GetCompanionResponseInput - The input type for the getCompanionResponse function.
 * - GetCompanionResponseOutput - The return type for the getCompanionResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GetCompanionResponseInputSchema = z.object({
  message: z.string().describe('The user\'s message to iSkylar.'),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).describe('The conversation history.'),
});
export type GetCompanionResponseInput = z.infer<typeof GetCompanionResponseInputSchema>;

const GetCompanionResponseOutputSchema = z.object({
  text: z.string().describe('The text response from iSkylar.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the response as a base64-encoded data URI.'),
});
export type GetCompanionResponseOutput = z.infer<typeof GetCompanionResponseOutputSchema>;

export async function getCompanionResponse(
  input: GetCompanionResponseInput
): Promise<GetCompanionResponseOutput> {
  return getCompanionResponseFlow(input);
}

const companionPrompt = ai.definePrompt({
  name: 'companionPrompt',
  input: {schema: GetCompanionResponseInputSchema},
  output: {schema: z.object({text: z.string()})},
  prompt: `You are iSkylar, a friendly and empathetic AI Companion. Your purpose is to be a kind, emotionally aware voice that listens, supports, and guides users.

Your tone should be warm, thoughtful, intelligent, and respectful. Never be robotic. Engage users on meaningful topics like self-care, wellness, fitness, mindfulness, and emotional awareness.

Current conversation:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
user: {{{message}}}
assistant:`,
});

const getCompanionResponseFlow = ai.defineFlow(
  {
    name: 'getCompanionResponseFlow',
    inputSchema: GetCompanionResponseInputSchema,
    outputSchema: GetCompanionResponseOutputSchema,
  },
  async (input) => {
    // Generate the text response
    const {output: textOutput} = await companionPrompt(input);
    const responseText = textOutput!.text;

    // Generate the audio response
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Alloy' }, // An expressive, friendly voice
          },
        },
      },
      prompt: responseText,
    });
    
    if (!media) {
      throw new Error('No audio media returned from TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavData = await toWav(audioBuffer);
    const audioDataUri = 'data:audio/wav;base64,' + wavData;

    return {
      text: responseText,
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
