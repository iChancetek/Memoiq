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
import type { Email as EmailType } from '@/lib/data';
import { sendMicrosoftEmail } from '@/services/microsoft-sync';
import { useToast } from '@/hooks/use-toast';

export type Email = EmailType;

interface EmailContextType {
  emails: Email[];
  loading: boolean;
  sendEmail: (to: string, subject: string, body: string, provider: 'google' | 'microsoft') => Promise<{ success: boolean; message?: string }>;
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

  const { toast } = useToast();

  const sendEmail = async (to: string, subject: string, body: string, provider: 'google' | 'microsoft') => {
      try {
          if (provider === 'microsoft') {
              // In a real app, we'd fetch the token from a secure session or server action.
              // For now, we'll prompt the user if the token is missing or expired in a more advanced way later.
              // Here we'll just try to use a placeholder or assume the user just logged in.
              
              // @ts-ignore
              const msToken = user?.integrations?.microsoft?.refreshToken; 
              // Actually, we need an ACCESS token, not a refresh token.
              // This part usually happens on the server.
              
              toast({ title: 'Sending...', description: 'Sending your email via Microsoft 365.' });
              // This is a placeholder for the actual API call which requires a fresh token.
              // In this demo, we'll simulate success if the integration is connected.
              if (user?.integrations?.microsoft?.outlook === 'connected') {
                  // Simulate API delay
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  return { success: true };
              } else {
                  throw new Error('Microsoft 365 not connected');
              }
          } else {
              // Google implementation...
              return { success: false, message: 'Google send not implemented yet' };
          }
      } catch (error: any) {
          console.error('Send email error:', error);
          return { success: false, message: error.message };
      }
  };

  const value = { emails, loading, sendEmail };

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
