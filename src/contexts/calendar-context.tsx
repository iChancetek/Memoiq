
'use client';

import * as React from 'react';
import { type CalendarEvent } from '@/lib/data';
import { useAuth } from './auth-context';
import {
  collection,
  query,
  onSnapshot,
  serverTimestamp,
  orderBy,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>, provider?: 'google' | 'microsoft', accountEmail?: string) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  loading: boolean;
}

const CalendarContext = React.createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { firestore: db } = useFirebase();

  React.useEffect(() => {
    if (user && db) {
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
    } else if (!user) {
      setEvents([]);
      setLoading(false);
    }
  }, [user, db]);

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>, provider: 'google' | 'microsoft' = 'google', accountEmail?: string) => {
    if (!user || !db) throw new Error("User not authenticated or DB not initialized");
    const collectionRef = collection(db, 'users', user.uid, 'events');
    
    // 1. Always store locally in Firestore for immediate UI update
    addDocumentNonBlocking(collectionRef, {
      ...event,
      provider: provider,
      accountEmail: accountEmail || null,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    // 2. Call external API if provider is connected
    if (provider === 'google') {
        const targetEmail = accountEmail || (user.integrations?.googleAccounts ? Object.keys(user.integrations.googleAccounts)[0] : null);
        if (targetEmail) {
            const actualEmail = targetEmail.replace(/_/g, '.');
            const { createGoogleEvent } = await import('@/services/google-sync');
            await createGoogleEvent(user.uid, actualEmail, {
                title: event.title,
                startTime: event.startTime,
                endTime: event.endTime,
                location: event.location,
                description: event.description
            });
        }
    } else if (provider === 'microsoft') {
        const targetEmail = accountEmail || (user.integrations?.microsoftAccounts ? Object.keys(user.integrations.microsoftAccounts)[0] : null);
        if (targetEmail) {
            const actualEmail = targetEmail.replace(/_/g, '.');
            const { createMicrosoftEvent } = await import('@/services/microsoft-sync');
            await createMicrosoftEvent(user.uid, actualEmail, {
                subject: event.title,
                start: { dateTime: event.startTime.toISOString(), timeZone: 'UTC' },
                end: { dateTime: event.endTime.toISOString(), timeZone: 'UTC' },
            });
        }
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!user || !db) return;
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    updateDocumentNonBlocking(eventRef, updates);
  };
  
  const deleteEvent = async (eventId: string) => {
    if (!user || !db) return;
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    deleteDocumentNonBlocking(eventRef);
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
