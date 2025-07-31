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
import wav from 'wav';

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
  model: 'googleai/gemini-1.5-flash',
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

const getAppointmentAnalysisFlow = ai.defineFlow(
  {
    name: 'getAppointmentAnalysisFlow',
    inputSchema: GetAppointmentAnalysisInputSchema,
    outputSchema: GetAppointmentAnalysisOutputSchema,
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
          console.log(`Appointment analysis attempt ${attempts} failed with 503, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
        } else {
          throw error;
        }
      }
    }

    if (!analysisOutput) {
      throw new Error('Failed to get appointment analysis after multiple attempts.');
    }

    const readableAnalysis = `
      Here is your appointment analysis.
      Summary: ${analysisOutput.summary}.
      Scheduling Risks: ${analysisOutput.schedulingRisks.join(', ') || 'None'}.
      Suggestions: ${analysisOutput.proactiveSuggestions.join('. ')}.
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
