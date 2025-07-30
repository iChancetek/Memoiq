'use client';

import * as React from 'react';
import { type Contact } from '@/lib/data';
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
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

interface ContactContextType {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  loading: boolean;
}

const ContactContext = React.createContext<ContactContextType | undefined>(undefined);
const db = getFirestore(firebaseApp);

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
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
    } else {
      setContacts([]);
      setLoading(false);
    }
  }, [user]);

  const addContact = async (contact: Omit<Contact, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error("User not authenticated");
    await addDoc(collection(db, 'users', user.uid, 'contacts'), {
      ...contact,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    if (!user) return;
    const contactRef = doc(db, 'users', user.uid, 'contacts', contactId);
    await updateDoc(contactRef, updates);
  };
  
  const deleteContact = async (contactId: string) => {
    if (!user) return;
    const contactRef = doc(db, 'users', user.uid, 'contacts', contactId);
    await deleteDoc(contactRef);
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
