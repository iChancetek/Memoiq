'use server';

import {config} from 'dotenv';
config({ path: '.env.local' });

// IMPORTANT: The dev entry point must be the first import.
import '@/ai/flows/get-personalized-insights.ts';
import '@/ai/flows/transcribe-and-summarize-memo.ts';
import '@/ai/flows/parse-task-string.ts';
import '@/ai/flows/schedule-appointment.ts';
import '@/ai/flows/get-contact-insights.ts';
import '@/ai/flows/get-tasks-analysis.ts';
import '@/ai/flows/get-calendar-analysis.ts';
import '@/ai/flows/get-appointment-analysis.ts';
import '@/ai/flows/get-companion-response.ts';
import '@/ai/flows/get-welcome-greeting.ts';
