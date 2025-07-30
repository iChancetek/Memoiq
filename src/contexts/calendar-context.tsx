'use client';

import * as React from 'react';
import { type CalendarEvent } from '@/lib/data';
import { useAuth } from './auth-context';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  loading: boolean;
}

const CalendarContext = React.createContext<CalendarContextType | undefined>(undefined);
const db = getFirestore(firebaseApp);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      setLoading(true);
      const q = query(
        collection(db, 'users', user.uid, 'events'),
        orderBy('startTime', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to JS Dates
                startTime: (data.startTime as Timestamp).toDate(),
                endTime: (data.endTime as Timestamp).toDate(),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
            }
        }) as CalendarEvent[];
        setEvents(userEvents);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching events:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [user]);

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error("User not authenticated");
    await addDoc(collection(db, 'users', user.uid, 'events'), {
      ...event,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!user) return;
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    await updateDoc(eventRef, updates);
  };
  
  const deleteEvent = async (eventId: string) => {
    if (!user) return;
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    await deleteDoc(eventRef);
  }

  const value = { events, addEvent, updateEvent, deleteEvent, loading };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = React.useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
