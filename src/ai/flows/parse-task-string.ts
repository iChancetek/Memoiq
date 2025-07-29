'use server';
/**
 * @fileOverview Parses a natural language string into a structured task object,
 * including generating relevant subtasks.
 *
 * - parseTaskString - A function that handles parsing a string into a task.
 * - ParseTaskStringInput - The input type for the parseTaskString function.
 * - ParseTaskStringOutput - The return type for the parseTaskString function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseTaskStringInputSchema = z.object({
  taskString: z.string().describe('The natural language description of the task.'),
  context: z.string().describe('Optional context about existing tasks or user preferences.')
});
export type ParseTaskStringInput = z.infer<typeof ParseTaskStringInputSchema>;

const ParseTaskStringOutputSchema = z.object({
  title: z.string().describe('The concise title of the task.'),
  dueDate: z.string().describe('The suggested due date for the task in YYYY-MM-DD format. If not specified, use a reasonable default.'),
  subtasks: z.array(z.string()).describe('A list of generated subtasks based on the main task. The list can be empty if no subtasks are necessary.'),
});
export type ParseTaskStringOutput = z.infer<typeof ParseTaskStringOutputSchema>;

export async function parseTaskString(
  input: ParseTaskStringInput
): Promise<ParseTaskStringOutput> {
  return parseTaskStringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseTaskStringPrompt',
  input: {schema: ParseTaskStringInputSchema},
  output: {schema: ParseTaskStringOutputSchema},
  prompt: `You are an expert at parsing tasks from natural language. Analyze the user's request and convert it into a structured task object.

User Request: "{{taskString}}"

Current Date: ${new Date().toDateString()}

Instructions:
1.  Determine a clear, concise title for the task.
2.  Identify the due date. If a specific date or day is mentioned (e.g., "by Thursday", "on the 25th"), calculate the date in YYYY-MM-DD format. If no date is given, suggest a reasonable future date (e.g., 3-7 days from now).
3.  Based on the task title, generate a list of 2-3 actionable subtasks that would help accomplish the main task. If the task is simple and doesn't need decomposition, return an empty array for subtasks.
4.  Consider the following context if provided: {{context}}

Output the structured task object.`,
});

const parseTaskStringFlow = ai.defineFlow(
  {
    name: 'parseTaskStringFlow',
    inputSchema: ParseTaskStringInputSchema,
    outputSchema: ParseTaskStringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
