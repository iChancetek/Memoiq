'use server';
import { openai } from '@/ai/openai-client';
import { z } from 'zod';

const GetCalendarAnalysisInputSchema = z.object({
  calendarEvents: z.string().describe("A JSON string of the user's calendar events."),
  tasks: z.string().describe("A JSON string of the user's tasks."),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});
export type GetCalendarAnalysisInput = z.infer<typeof GetCalendarAnalysisInputSchema>;

const GetCalendarAnalysisOutputSchema = z.object({
  summary: z.string().describe("Summary of the user's schedule for the next 7 days."),
  busyPeriods: z.array(z.string()).describe("List of identified busy days or times."),
  suggestions: z.array(z.string()).describe("List of 2-3 actionable suggestions."),
  audioDataUri: z.string().describe('The text-to-speech audio as a base64-encoded data URI.'),
});
export type GetCalendarAnalysisOutput = z.infer<typeof GetCalendarAnalysisOutputSchema>;

export async function getCalendarAnalysis(
  input: GetCalendarAnalysisInput
): Promise<GetCalendarAnalysisOutput> {
  const { calendarEvents, tasks, currentDate } = input;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content: "You are a world-class executive assistant and scheduling expert. Analyze the user's calendar and task list and provide a strategic briefing in JSON format."
        },
        {
          role: "user",
          content: `Current Date: ${currentDate}\nCalendar Events: ${calendarEvents}\nTasks: ${tasks}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    
    // Safety casts for React minified errors
    const summary = typeof parsed.summary === 'string' ? parsed.summary 
      : typeof parsed.summary === 'object' ? JSON.stringify(parsed.summary) : "Your schedule looks manageable.";
      
    const busyPeriods = Array.isArray(parsed.busyPeriods) 
      ? parsed.busyPeriods.map((p: any) => typeof p === 'object' ? JSON.stringify(p) : String(p))
      : [];
      
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((s: any) => typeof s === 'object' ? JSON.stringify(s) : String(s))
      : [];

    const readableAnalysis = `Here is your calendar analysis. Summary: ${summary}. Busy periods: ${busyPeriods.join(', ') || 'None'}. Suggestions: ${suggestions.join('. ')}.`;

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: readableAnalysis,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    return {
      summary,
      busyPeriods,
      suggestions,
      audioDataUri,
    };
  } catch (error: any) {
    console.error('Error in getCalendarAnalysis:', error);
    return {
      summary: "Error generating analysis.",
      busyPeriods: [],
      suggestions: [],
      audioDataUri: "",
    };
  }
}
