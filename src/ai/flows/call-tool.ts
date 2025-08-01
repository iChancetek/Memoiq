'use server';

/**
 * @fileOverview A flow to dynamically call a registered Genkit tool by name.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getTasks, getContacts, getCalendarEvents, getMemos, getScribeEntries } from './get-rag-response';

// Map of all available tools
const availableTools: Record<string, any> = {
  getTasks,
  getContacts,
  getCalendarEvents,
  getMemos,
  getScribeEntries,
};

const CallToolInputSchema = z.object({
  name: z.string().describe('The name of the tool to call.'),
  input: z.any().describe('The input to pass to the tool.'),
});
export type CallToolInput = z.infer<typeof CallToolInputSchema>;

export async function callTool(input: CallToolInput) {
  const { name, input: toolInput } = input;
  const tool = availableTools[name];

  if (!tool) {
    throw new Error(`Tool "${name}" not found.`);
  }

  const output = await tool(toolInput);
  
  return {
    name,
    output,
  };
}
