
'use client';

import * as React from 'react';
import { type Contact } from '@/lib/data';
import { useAuth } from './auth-context';
import {
  collection,
  query,
  onSnapshot,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ContactContextType {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  loading: boolean;
}

const ContactContext = React.createContext<ContactContextType | undefined>(undefined);

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { firestore: db } = useFirebase();

  React.useEffect(() => {
    if (user && db) {
      setLoading(true);
      const q = query(
        collection(db, 'users', user.uid, 'contacts'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userContacts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Contact[];
        setContacts(userContacts);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching contacts:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (!user) {
      setContacts([]);
      setLoading(false);
    }
  }, [user, db]);

  const addContact = async (contact: Omit<Contact, 'id' | 'userId' | 'createdAt'>) => {
    if (!user || !db) throw new Error("User not authenticated or DB not initialized");
    const collectionRef = collection(db, 'users', user.uid, 'contacts');
    addDocumentNonBlocking(collectionRef, {
      ...contact,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    if (!user || !db) return;
    const contactRef = doc(db, 'users', user.uid, 'contacts', contactId);
    updateDocumentNonBlocking(contactRef, updates);
  };
  
  const deleteContact = async (contactId: string) => {
    if (!user || !db) return;
    const contactRef = doc(db, 'users', user.uid, 'contacts', contactId);
    deleteDocumentNonBlocking(contactRef);
  }

  const value = { contacts, addContact, updateContact, deleteContact, loading };

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContacts() {
  const context = React.useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
}
