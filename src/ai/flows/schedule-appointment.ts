
'use server';
/**
 * @fileOverview Handles scheduling appointments using natural language.
 *
 * - scheduleAppointment - A function that finds available slots and suggests times.
 * - ScheduleAppointmentInput - The input type for the scheduleAppointment function.
 * - ScheduleAppointmentOutput - The return type for the scheduleAppointment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { format } from 'date-fns';
import { gpt4o } from 'genkitx-openai';

const ScheduleAppointmentInputSchema = z.object({
  request: z
    .string()
    .describe('The user request for scheduling an appointment.'),
  calendarEvents: z
    .string()
    .describe('A JSON string of current calendar events to check for conflicts.'),
  tasks: z
    .string()
    .describe('A JSON string of current tasks to check for conflicts.'),
  contacts: z.string().describe("A JSON string of the user's contacts."),
});
export type ScheduleAppointmentInput = z.infer<
  typeof ScheduleAppointmentInputSchema
>;

const ScheduleAppointmentOutputSchema = z.object({
  isPossible: z
    .boolean()
    .describe('Whether the requested appointment time could be found.'),
  title: z.string().describe('The concise title of the appointment.'),
  suggestedDate: z
    .string()
    .describe(
      'The suggested date in YYYY-MM-DD format. Or an empty string if not possible.'
    ),
  suggestedTime: z
    .string()
    .describe('The suggested time in h:mm a format (e.g., 2:30 PM). Or an empty string if not possible.'),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of the result, confirming the time or explaining the conflict.'
    ),
});
export type ScheduleAppointmentOutput = z.infer<
  typeof ScheduleAppointmentOutputSchema
>;

export async function scheduleAppointment(
  input: ScheduleAppointmentInput
): Promise<ScheduleAppointmentOutput> {
  return scheduleAppointmentFlow(input);
}


const prompt = ai.definePrompt({
  name: 'scheduleAppointmentPrompt',
  input: {schema: ScheduleAppointmentInputSchema},
  output: {schema: ScheduleAppointmentOutputSchema},
  model: gpt4o,
  prompt: `You are an intelligent scheduling assistant. Your goal is to parse a user's appointment request, check their calendar for conflicts, and determine if the slot is available.

Current Date: ${format(new Date(), 'EEEE, MMMM do, yyyy')}

User Request: "{{request}}"

Existing Calendar Events (JSON):
{{{calendarEvents}}}

Existing Tasks with due dates (JSON):
{{{tasks}}}

CRITICAL INSTRUCTIONS:
1.  **Source of Truth**: You MUST only use the provided 'Existing Calendar Events' and 'Existing Tasks' as the source of truth for the user's schedule. **Do not invent, assume, or hallucinate any other events or appointments.**
2.  **Parse Request**: Analyze the user's request to determine the desired title, date, time, and duration. If duration is not specified, assume a default of 1 hour.
3.  **Conflict Definition**: A conflict exists ONLY if the requested time range for the new event OVERLAPS with an existing event's time range. An event on the same day but at a different, non-overlapping time is NOT a conflict.
4.  **Working Hours**: The user's working hours are 9:00 AM to 5:00 PM on weekdays. Only schedule appointments within these hours unless the user specifically requests a time outside of them.
5.  **Scheduling Logic**:
    a. **No Conflict**: If the requested time is available (no overlap with existing events), set 'isPossible' to true. Provide the requested date and time. State clearly in the 'reasoning' that the time is available.
    b. **Conflict Found**: If the requested time directly conflicts (overlaps) with an existing event, set 'isPossible' to false. State clearly in the 'reasoning' which existing event it conflicts with. Do not suggest another time.

Provide a clear 'reasoning' for your decision, either confirming the time is free or explaining the direct conflict.
`,
});

const scheduleAppointmentFlow = ai.defineFlow(
  {
    name: 'scheduleAppointmentFlow',
    inputSchema: ScheduleAppointmentInputSchema,
    outputSchema: ScheduleAppointmentOutputSchema,
  },
  async input => {
    const result = await prompt(input);
    return result.output!;
  }
);
