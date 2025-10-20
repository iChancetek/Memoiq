import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export const MemoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  summary: z.string(),
  transcription: z.string().optional(),
  date: z.string(),
  createdAt: z.any(), // Zod doesn't have a Timestamp type, so we use any
});
export type Memo = z.infer<typeof MemoSchema>;

export const ScribeEntrySchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    audioUrl_en: z.string(),
    audioUrl_es: z.string().optional(),
    storagePath_en: z.string(),
    storagePath_es: z.string().optional(),
    transcription_en: z.string(),
    transcription_es: z.string().optional(),
    createdAt: z.any(),
});
export type ScribeEntry = z.infer<typeof ScribeEntrySchema>;


export const SubtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});
export type Subtask = z.infer<typeof SubtaskSchema>;


export const TaskSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().optional(),
    subtasks: z.array(SubtaskSchema).optional(),
    contactIds: z.array(z.string()).optional(),
    createdAt: z.any(),
});
export type Task = z.infer<typeof TaskSchema>;


export const CalendarEventSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    location: z.string().optional(),
    createdAt: z.any(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const ContactSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    title: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    lastContact: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.any(),
});
export type Contact = z.infer<typeof ContactSchema>;
