
'use server';
/**
 * @fileOverview Handles scheduling appointments using natural language.
 *
 * - scheduleAppointment - A function that finds available slots and suggests times.
 * - ScheduleAppointmentInput - The input type for the scheduleAppointment function.
 * - ScheduleAppointmentOutput - The return type for the scheduleAppointment function.
 */

import { openai } from '@/ai/openai-client';
import { z } from 'zod';
import { format } from 'date-fns';

const ScheduleAppointmentInputSchema = z.object({
  request: z.string().describe('The user request for scheduling an appointment.'),
  calendarEvents: z.string().describe('A JSON string of current calendar events to check for conflicts.'),
  tasks: z.string().describe('A JSON string of current tasks to check for conflicts.'),
  contacts: z.string().describe("A JSON string of the user's contacts."),
});
export type ScheduleAppointmentInput = z.infer<typeof ScheduleAppointmentInputSchema>;

const ScheduleAppointmentOutputSchema = z.object({
  isPossible: z.boolean().describe('Whether a possible appointment time could be found.'),
  title: z.string().describe('The concise title of the appointment.'),
  suggestedDate: z.string().describe('The suggested date in YYYY-MM-DD format.'),
  suggestedTime: z.string().describe('The suggested time in h:mm a format.'),
  reasoning: z.string().describe('A brief explanation of the result.'),
});
export type ScheduleAppointmentOutput = z.infer<typeof ScheduleAppointmentOutputSchema>;

export async function scheduleAppointment(
  input: ScheduleAppointmentInput
): Promise<ScheduleAppointmentOutput> {
  const { request, calendarEvents, tasks, contacts } = input;

  const prompt = `You are an intelligent scheduling assistant. Your goal is to parse a user's appointment request, check their calendar for conflicts, and schedule the appointment or suggest an alternative.

Current Date: ${format(new Date(), 'EEEE, MMMM do, yyyy')}

User Request: "${request}"

Existing Calendar Events (JSON):
${calendarEvents}

Existing Tasks (JSON):
${tasks}

Instructions:
1.  Parse Request: Determine title, date, and time. Default duration: 1 hour.
2.  Working Hours: 9:00 AM to 5:00 PM weekdays.
3.  Scheduling Logic:
    - No Conflict: Set isPossible to true, provide requested time.
    - Conflict Found: Suggest next available 1-hour slot on the same day if possible.
    - No Alternative: Set isPossible to false.

Output MUST be a JSON object with the following fields:
- isPossible (boolean)
- title (string)
- suggestedDate (string, YYYY-MM-DD)
- suggestedTime (string, h:mm a)
- reasoning (string)`;

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
    
    return ScheduleAppointmentOutputSchema.parse(result);

  } catch (error: any) {
    console.error('Error in scheduleAppointment:', error);
    return {
      isPossible: false,
      title: "Error",
      suggestedDate: "",
      suggestedTime: "",
      reasoning: "I encountered an error while analyzing your schedule."
    };
  }
}
