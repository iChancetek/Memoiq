import { config } from 'dotenv';
config();

import '@/ai/flows/get-personalized-insights.ts';
import '@/ai/flows/transcribe-and-summarize-memo.ts';
import '@/ai/flows/parse-task-string.ts';
import '@/ai/flows/schedule-appointment.ts';
import '@/ai/flows/get-contact-insights.ts';
import '@/ai/flows/get-tasks-analysis.ts';
