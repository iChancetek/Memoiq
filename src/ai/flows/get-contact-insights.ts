'use server';
/**
 * @fileOverview Analyzes contacts and suggests follow-ups.
 *
 * - getContactInsights - A function that generates insights about contacts.
 * - GetContactInsightsInput - The input type for the getContactInsights function.
 * - GetContactInsightsOutput - The return type for the getContactInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GetContactInsightsInputSchema = z.object({
  contacts: z.string().describe('A JSON string of the user\'s contacts, including name, company, and last contact date.'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetContactInsightsInput = z.infer<typeof GetContactInsightsInputSchema>;

const GetContactInsightsOutputSchema = z.object({
  followUpSuggestions: z.string().describe('A formatted string with suggestions for which contacts to follow up with, including the reason. Suggest 2-3 contacts.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the analysis as a base64-encoded data URI.'),
});
export type GetContactInsightsOutput = z.infer<typeof GetContactInsightsOutputSchema>;

export async function getContactInsights(
  input: GetContactInsightsInput
): Promise<GetContactInsightsOutput> {
  return getContactInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getContactInsightsPrompt',
  input: {schema: GetContactInsightsInputSchema},
  output: {schema: GetContactInsightsOutputSchema.omit({ audioDataUri: true })},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a relationship management assistant. Your goal is to help users maintain professional connections by suggesting timely follow-ups.

Current Date: {{{currentDate}}}

User's Contacts (JSON):
{{{contacts}}}

Instructions:
1.  Analyze the user's contact list. Pay close attention to the 'lastContact' date for each person.
2.  Identify 2-3 contacts who haven't been contacted in a while (e.g., more than 30-45 days ago).
3.  Prioritize contacts where a follow-up seems logical based on their role or notes.
4.  Generate a concise, actionable list of follow-up suggestions. For each suggestion, briefly state why it's a good time to reach out.
5.  Format the output as a single string, with each suggestion on a new line, starting with a "-".

Example output:
- Samuel Rodriguez: It's been over two months since your last chat. A good time to reconnect about Q4 marketing ideas.
- Olivia Chen: You haven't spoken since late July. Check in on Project Phoenix progress.`,
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

const getContactInsightsFlow = ai.defineFlow(
  {
    name: 'getContactInsightsFlow',
    inputSchema: GetContactInsightsInputSchema,
    outputSchema: GetContactInsightsOutputSchema,
  },
  async input => {
    let analysisOutput;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await prompt(input);
        analysisOutput = result.output;
        if (analysisOutput) {
            break; // Success
        }
        attempts++;
        if (attempts >= maxAttempts) {
            throw new Error('AI returned empty output after multiple attempts.');
        }
      } catch (error: any) {
        attempts++;
        if (error.message && error.message.includes('503') && attempts < maxAttempts) {
          console.log(`Contact insights attempt ${attempts} failed with 503, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
        } else {
          throw error;
        }
      }
    }

    if (!analysisOutput) {
      throw new Error('Failed to get contact insights after multiple attempts.');
    }
    
    const readableAnalysis = `
      Here are your contact suggestions.
      ${analysisOutput.followUpSuggestions}.
    `;

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
      prompt: readableAnalysis,
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
        ...analysisOutput,
        audioDataUri,
    };
  }
);
