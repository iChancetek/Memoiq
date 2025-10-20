
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
    .describe('Whether the appointment can be scheduled as requested.'),
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
      'A brief explanation of why the appointment is or is not possible, or any conflicts found.'
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
  prompt: `You are an intelligent scheduling assistant. Your goal is to parse a user's appointment request, check their calendar and tasks for conflicts, and suggest a valid time slot. You also have access to the user's contacts.

Current Date: ${format(new Date(), 'EEEE, MMMM do, yyyy')}

User Request: "{{request}}"

Existing Calendar Events (JSON):
{{{calendarEvents}}}

Existing Tasks with due dates (JSON):
{{{tasks}}}

User's Contacts (JSON):
{{{contacts}}}

Instructions:
1.  Analyze the user's request to determine the desired title, date, time, and attendees.
2.  If attendees are mentioned, cross-reference with the user's contacts. Use information like the last contact date to add helpful context to your reasoning.
3.  The user's working hours are 9:00 AM to 5:00 PM on weekdays. Do not schedule appointments outside of these hours unless specifically requested.
4.  Check for conflicts with existing calendar events and task due dates. An event or task creates a conflict if it's on the same day. Be mindful of descriptive times like "afternoon" (1 PM - 5 PM) or "morning" (9 AM - 12 PM).
5.  If the requested time is available, set 'isPossible' to true and provide the suggestedDate (YYYY-MM-DD) and suggestedTime (h:mm a).
6.  If the requested time is not available, find the next available slot on the same day or the next suitable day and suggest it. Set 'isPossible' to true and provide the new suggestedDate and suggestedTime.
7.  If no reasonable time can be found (e.g., the user asks for a time that has passed or the entire day is blocked), set 'isPossible' to false and explain why in the 'reasoning' field.
8.  Provide a clear 'reasoning' for your suggestion, confirming the scheduled time or explaining the conflict and alternative. Mention contact-related insights if relevant.

Example Reasoning: "I've scheduled 'Lunch with Samuel Rodriguez'. You haven't spoken since June, so it's a great time to reconnect. The suggested time is clear of conflicts."
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
