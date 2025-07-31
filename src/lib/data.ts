import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type Memo = {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  summary: string;
  transcription?: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
};

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
    dueDate: z.string(),
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
    location: z.string(),
    createdAt: z.any(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const ContactSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    title: z.string(),
    company: z.string(),
    email: z.string(),
    lastContact: z.string(),
    notes: z.string(),
    createdAt: z.any(),
});
export type Contact = z.infer<typeof ContactSchema>;


export const mockContacts: Omit<Contact, 'id' | 'userId' | 'createdAt'>[] = [
    {
      name: 'Samuel Rodriguez',
      title: 'Marketing Director',
      company: 'Innovate Inc.',
      email: 'samuel.r@innovate.com',
      lastContact: '2024-06-15',
      notes: 'Met at the downtown tech meetup. Interested in our B2B marketing solutions. Potential for a large-scale collaboration.',
    },
    {
      name: 'Olivia Chen',
      title: 'Project Manager',
      company: 'Phoenix Solutions',
      email: 'olivia.c@phoenix.co',
      lastContact: '2024-07-22',
      notes: 'Lead on the Project Phoenix account. Very detail-oriented and expects weekly updates. Prefers email communication.',
    },
    {
      name: 'Ben Carter',
      title: 'Lead Developer',
      company: 'Quantum Leap',
      email: 'ben.carter@quantum.dev',
      lastContact: '2024-08-01',
      notes: 'Old colleague from a previous company. Expert in backend architecture. Good contact for technical advice or potential recruitment.',
    },
    {
      name: 'Sophia Loren',
      title: 'Venture Capitalist',
      company: 'Horizon Ventures',
      email: 'sophia@horizon.vc',
      lastContact: '2024-05-30',
      notes: 'Expressed interest in our seed round. Follow up required with Q3 financial projections. She is a key potential investor.',
    },
  ];

  export const mockCalendarEvents: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'startTime' | 'endTime'>[] = [
    {
        title: "Q3 Planning Session",
        location: "Boardroom A",
    },
    {
        title: "Lunch with Olivia Chen",
        location: "The Corner Bistro",
    },
    {
        title: "Team-wide Stand-up",
        location: "Virtual (Google Meet)",
    },
    {
        title: "Dentist Appointment",
        location: "Downtown Dental Clinic",
    },
];
