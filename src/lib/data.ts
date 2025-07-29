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
