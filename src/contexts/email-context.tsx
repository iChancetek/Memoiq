'use client';

import * as React from 'react';
import { useAuth } from './auth-context';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export interface Email {
    id: string;
    userId: string;
    from: string;
    subject: string;
    snippet: string;
    receivedAt: Timestamp;
    createdAt: Timestamp;
}


interface EmailContextType {
  emails: Email[];
  loading: boolean;
}

const EmailContext = React.createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [emails, setEmails] = React.useState<Email[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { firestore: db } = useFirebase();

  React.useEffect(() => {
    if (user && db) {
      setLoading(true);
      const q = query(
        collection(db, 'users', user.uid, 'emails'),
        orderBy('receivedAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userEmails = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as Email;
        });
        setEmails(userEmails);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching emails:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (!user) {
      setEmails([]);
      setLoading(false);
    }
  }, [user, db]);

  const value = { emails, loading };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmails() {
  const context = React.useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmails must be used within an EmailProvider');
  }
  return context;
}
