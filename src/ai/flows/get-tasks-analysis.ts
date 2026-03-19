'use server';
/**
 * @fileOverview Analyzes a user's task list to provide strategic insights.
 *
 * - getTasksAnalysis - A function that generates a high-level analysis of tasks.
 * - GetTasksAnalysisInput - The input type for the getTasksAnalysis function.
 * - GetTasksAnalysisOutput - The return type for the getTasksAnalysis function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

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
  const { tasks, currentDate } = input;

  const prompt = `You are a world-class productivity coach and project manager. Your goal is to analyze a user's task list and provide a strategic, intelligent briefing.

Current Date: ${currentDate}

User's Task List (JSON):
${tasks}

Instructions:
1.  **Summary**: Provide a concise, one-sentence summary of the overall workload.
2.  **Identify Priority Task**: Identify the single most critical task that the user should focus on next. Provide reasoning.
3.  **Assess Risks**: Look for overdue tasks, bottlenecks. Set 'hasRisk' accordingly.
4.  **Provide Actionable Suggestions**: Generate 2-3 actionable suggestions.

Output MUST be a JSON object with the following structure:
{
  "summary": "string",
  "priorityTask": { "title": "string", "reasoning": "string" },
  "risk": { "hasRisk": boolean, "description": "string" },
  "suggestions": ["string"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const analysisOutput = JSON.parse(content);

    const readableAnalysis = `
      Here is your task analysis.
      Summary: ${analysisOutput.summary}.
      Your priority task is ${analysisOutput.priorityTask.title}, because ${analysisOutput.priorityTask.reasoning}.
      ${analysisOutput.risk.hasRisk ? `Risk detected: ${analysisOutput.risk.description}` : 'No risks detected.'}
      Suggestions: ${analysisOutput.suggestions.join('. ')}.
    `;

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: readableAnalysis,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    return {
      ...analysisOutput,
      audioDataUri,
    };

  } catch (error: any) {
    console.error('Error in getTasksAnalysis:', error);
    return {
      summary: "Unable to analyze tasks.",
      priorityTask: { title: "", reasoning: "" },
      risk: { hasRisk: false, description: "" },
      suggestions: [],
      audioDataUri: "",
    };
  }
}
