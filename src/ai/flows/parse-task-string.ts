'use server';
/**
 * @fileOverview Parses a natural language string into a structured task object,
 * including generating relevant subtasks and linking contacts.
 *
 * - parseTaskString - A function that handles parsing a string into a task.
 * - ParseTaskStringInput - The input type for the parseTaskString function.
 * - ParseTaskStringOutput - The return type for the parseTaskString function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const ParseTaskStringInputSchema = z.object({
  taskString: z.string().describe('The natural language description of the task.'),
  contacts: z.string().describe("A JSON string of the user's contacts, used to identify people mentioned in the task."),
  context: z.string().describe('Optional context about existing tasks or user preferences.')
});
export type ParseTaskStringInput = z.infer<typeof ParseTaskStringInputSchema>;

const ParseTaskStringOutputSchema = z.object({
  title: z.string().describe('The concise title of the task.'),
  dueDate: z.string().describe('The suggested due date for the task in YYYY-MM-DD format. If not specified, use a reasonable default.'),
  subtasks: z.array(z.string()).describe('A list of generated subtasks based on the main task. The list can be empty if no subtasks are necessary.'),
  contactIds: z.array(z.string()).describe("A list of IDs for any contacts mentioned in the task string. This should correspond to the IDs from the input contacts list."),
});
export type ParseTaskStringOutput = z.infer<typeof ParseTaskStringOutputSchema>;

export async function parseTaskString(
  input: ParseTaskStringInput
): Promise<ParseTaskStringOutput> {
  const { taskString, contacts, context } = input;

  const prompt = `You are an expert at parsing tasks from natural language. Analyze the user's request and convert it into a structured task object.

User Request: "${taskString}"
User's Contacts: ${contacts}
Current Date: ${new Date().toDateString()}

Instructions:
1.  Determine a clear, concise title for the task.
2.  Identify the due date. If a specific date or day is mentioned, calculate the date in YYYY-MM-DD format. If no date is given, suggest a reasonable future date (e.g., 3-7 days from now).
3.  Based on the task title, generate a list of 2-3 actionable subtasks that would help accomplish the main task. If the task is simple and doesn't need decomposition, return an empty array for subtasks.
4.  Scan the task string for any names that match the user's contacts. If a match is found, include the corresponding contact's ID (which is a string) in the 'contactIds' array.

Context: ${context}

Output MUST be a JSON object with the following fields:
- title (string)
- dueDate (string, YYYY-MM-DD)
- subtasks (array of strings)
- contactIds (array of strings)`;

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
    const result = JSON.parse(content);
    
    return ParseTaskStringOutputSchema.parse(result);

  } catch (error: any) {
    console.error('Error in parseTaskString:', error);
    return {
        title: taskString,
        dueDate: new Date().toISOString().split('T')[0],
        subtasks: [],
        contactIds: []
    };
  }
}
