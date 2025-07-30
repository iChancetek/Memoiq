import type { Timestamp } from 'firebase/firestore';

export type Memo = {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  summary: string;
  transcription?: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
};

export type Subtask = {
  id: string; // Using string for potential unique IDs
  title: string;
  completed: boolean;
};

export type Task = {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  subtasks?: Subtask[];
  contactIds?: string[];
  createdAt: Timestamp;
};

export type CalendarEvent = {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location: string;
  createdAt: Timestamp;
};

export type Contact = {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  lastContact: string; // YYYY-MM-DD
  notes: string;
  createdAt: Timestamp;
};


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
