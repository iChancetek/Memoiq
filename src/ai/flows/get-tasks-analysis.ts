'use server';
/**
 * @fileOverview Analyzes a user's task list to provide strategic insights.
 *
 * - getTasksAnalysis - A function that generates a high-level analysis of tasks.
 * - GetTasksAnalysisInput - The input type for the getTasksAnalysis function.
 * - GetTasksAnalysisOutput - The return type for the getTasksAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GetTasksAnalysisInputSchema = z.object({
  tasks: z.string().describe("A JSON string of the user's tasks, including title, due date, and completion status."),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetTasksAnalysisInput = z.infer<typeof GetTasksAnalysisInputSchema>;

const GetTasksAnalysisOutputSchema = z.object({
  summary: z.string().describe('A brief, high-level summary of the current task situation.'),
  priorityTask: z.object({
      title: z.string().describe('The single most important task to focus on.'),
      reasoning: z.string().describe('The reasoning behind why this task is the priority.'),
  }),
  risk: z.object({
      hasRisk: z.boolean().describe('Whether a potential risk (e.g., overdue task, bottleneck) is detected.'),
      description: z.string().describe('A description of the risk if one is detected. Empty if no risk.'),
  }),
  suggestions: z.array(z.string()).describe('A list of 2-3 actionable suggestions to improve productivity or address issues.'),
  audioDataUri: z.string().describe('The text-to-speech audio of the analysis as a base64-encoded data URI.'),
});
export type GetTasksAnalysisOutput = z.infer<typeof GetTasksAnalysisOutputSchema>;

export async function getTasksAnalysis(
  input: GetTasksAnalysisInput
): Promise<GetTasksAnalysisOutput> {
  return getTasksAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTasksAnalysisPrompt',
  input: {schema: GetTasksAnalysisInputSchema},
  output: {schema: GetTasksAnalysisOutputSchema.omit({ audioDataUri: true })},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a world-class productivity coach and project manager. Your goal is to analyze a user's task list and provide a strategic, intelligent briefing.

Current Date: {{{currentDate}}}

User's Task List (JSON):
{{{tasks}}}

Instructions:
1.  **Summary**: Provide a concise, one-sentence summary of the overall workload. (e.g., "You have a busy week ahead focused on Project Apollo," or "Your workload seems manageable with a few key deadlines approaching.")
2.  **Identify Priority Task**: Analyze all tasks, considering due dates, task titles, and dependencies (implied from titles). Identify the single most critical task that the user should focus on next. Provide a clear reason why it's the priority.
3.  **Assess Risks**: Look for potential problems. This includes overdue tasks, tasks with close deadlines that seem large, or potential bottlenecks (e.g., multiple tasks due on the same day). If a risk is found, set 'hasRisk' to true and describe it clearly. If not, set 'hasRisk' to false.
4.  **Provide Actionable Suggestions**: Based on your analysis, generate a list of 2-3 concrete, actionable suggestions. These should not be simple task reminders. Instead, they should be strategic tips. Examples: "Consider breaking down 'Draft proposal' into smaller research and writing subtasks," or "Since two major tasks are due on Friday, try to complete the review for one of them by Wednesday to spread out the workload."

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

const getTasksAnalysisFlow = ai.defineFlow(
  {
    name: 'getTasksAnalysisFlow',
    inputSchema: GetTasksAnalysisInputSchema,
    outputSchema: GetTasksAnalysisOutputSchema,
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
        if (error.message && (error.message.includes('503') || error.message.includes('429')) && attempts < maxAttempts) {
          console.log(`Task analysis attempt ${attempts} failed with ${error.message}, retrying...`);
          await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
        } else {
          throw error;
        }
      }
    }

    if (!analysisOutput) {
      throw new Error('Failed to get task analysis after multiple attempts.');
    }

    const readableAnalysis = `
      Here is your task analysis.
      Summary: ${analysisOutput.summary}.
      Your priority task is ${analysisOutput.priorityTask.title}, because ${analysisOutput.priorityTask.reasoning}.
      ${analysisOutput.risk.hasRisk ? `Risk detected: ${analysisOutput.risk.description}` : 'No risks detected.'}
      Suggestions: ${analysisOutput.suggestions.join('. ')}.
    `;

    let media;
    attempts = 0; // Reset for TTS
     while (attempts < maxAttempts) {
        try {
            const ttsResponse = await ai.generate({
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
