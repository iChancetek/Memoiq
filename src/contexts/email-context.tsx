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
  sendEmail: (to: string, subject: string, body: string, provider: 'google' | 'microsoft', accountEmail?: string) => Promise<{ success: boolean; message?: string }>;
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

  const sendEmail = async (to: string, subject: string, body: string, provider: 'google' | 'microsoft', accountEmail?: string) => {
      try {
          if (provider === 'microsoft') {
              if (!user) throw new Error('User not authenticated');
              const targetEmail = accountEmail || (user.integrations?.microsoftAccounts ? Object.keys(user.integrations.microsoftAccounts)[0] : null);
              if (!targetEmail) throw new Error('No Microsoft account connected');
              
              const actualEmail = targetEmail.replace(/_/g, '.');
              toast({ title: 'Sending...', description: `Sending via ${actualEmail}...` });
              
              const { sendMicrosoftEmail } = await import('@/services/microsoft-sync');
              return await sendMicrosoftEmail(user.uid, actualEmail, to, subject, body);
          } else {
              // Google implementation
              if (!user) throw new Error('User not authenticated');
              
              // If accountEmail not specified, use the first one available
              const targetEmail = accountEmail || (user.integrations?.googleAccounts ? Object.keys(user.integrations.googleAccounts)[0] : null);
              
              if (!targetEmail) {
                  throw new Error('No Google account connected');
              }

              const actualEmail = targetEmail.replace(/_/g, '.'); // Handle key normalization
              
              toast({ title: 'Sending...', description: `Sending via ${actualEmail}...` });
              
              const { sendGoogleEmail } = await import('@/services/google-sync');
              return await sendGoogleEmail(user.uid, actualEmail, to, subject, body);
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
