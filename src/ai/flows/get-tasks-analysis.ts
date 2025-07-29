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
  output: {schema: GetTasksAnalysisOutputSchema},
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

const getTasksAnalysisFlow = ai.defineFlow(
  {
    name: 'getTasksAnalysisFlow',
    inputSchema: GetTasksAnalysisInputSchema,
    outputSchema: GetTasksAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
