
'use client';

import * as React from 'react';
import { useAuth } from './auth-context';
import {
  collection,
  query,
  onSnapshot,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useStorage } from './storage-context';
import { scribeTranscribe } from '@/ai/flows/scribe-transcribe-and-translate';
import { translateText } from '@/ai/flows/translate-text';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export interface ScribeEntry {
    id: string;
    userId: string;
    title: string;
    audioUrl_en: string;
    audioUrl_es: string;
    storagePath_en: string;
    storagePath_es: string;
    transcription_en: string;
    transcription_es: string;
    createdAt: Timestamp;
}

interface MediScribeContextType {
  scribeEntries: ScribeEntry[];
  addScribeEntry: (audioBlob: Blob) => Promise<void>;
  deleteScribeEntry: (entryId: string) => Promise<void>;
  translateScribeEntry: (entryId: string, targetLanguage: 'en' | 'es', text: string) => Promise<void>;
  loading: boolean;
}

const MediScribeContext = React.createContext<MediScribeContextType | undefined>(undefined);

export function MediScribeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { uploadFile, deleteFile } = useStorage();
  const [scribeEntries, setScribeEntries] = React.useState<ScribeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { firestore: db } = useFirebase();

  React.useEffect(() => {
    if (user && db) {
      setLoading(true);
      const q = query(
        collection(db, 'users', user.uid, 'scribeEntries'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ScribeEntry[];
        setScribeEntries(entries);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching scribe entries:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setScribeEntries([]);
      setLoading(false);
    }
  }, [user, db]);

  const addScribeEntry = async (audioBlob: Blob) => {
    if (!user) throw new Error("User not authenticated");
    if (!db) throw new Error("Firestore not initialized");

    // 1. Upload audio to Firebase Storage
    const fileExtension = audioBlob.type.split('/')[1] || 'webm';
    const storagePath = `scribe-audio/${user.uid}/${Date.now()}.${fileExtension}`;
    const audioUrl = await uploadFile(storagePath, audioBlob, { contentType: audioBlob.type });

    // 2. Convert Blob to a data URI string to pass to the server action
    const reader = new FileReader();
    const dataUriPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(audioBlob);
    const audioDataUri = await dataUriPromise;

    // 3. Get transcription via server action
    const { transcription } = await scribeTranscribe({
      audioDataUri,
    });
    
    // 4. Save metadata to Firestore
    const collectionRef = collection(db, 'users', user.uid, 'scribeEntries');
    addDocumentNonBlocking(collectionRef, {
      userId: user.uid,
      title: `Recording - ${new Date().toLocaleString()}`,
      audioUrl_en: audioUrl,
      storagePath_en: storagePath,
      transcription_en: transcription,
      audioUrl_es: '',
      storagePath_es: '',
      transcription_es: '',
      createdAt: serverTimestamp(),
    });
  };
  
  const deleteScribeEntry = async (entryId: string) => {
    if (!user || !db) return;
    const entry = scribeEntries.find(e => e.id === entryId);
    if (!entry) return;

    if (entry.storagePath_en) await deleteFile(entry.storagePath_en);
    if (entry.storagePath_es) await deleteFile(entry.storagePath_es);
    
    const entryRef = doc(db, 'users', user.uid, 'scribeEntries', entryId);
    deleteDocumentNonBlocking(entryRef);
  }

  const translateScribeEntry = async (entryId: string, targetLanguage: 'en' | 'es', text: string) => {
      if (!user || !db) throw new Error("User not authenticated or DB not initialized");
      const entry = scribeEntries.find(e => e.id === entryId);
      if (!entry) throw new Error("Scribe entry not found");

      const { translation } = await translateText({ text, targetLanguage });

      const { audioDataUri } = await textToSpeech({ text: translation });

      const audioBlob = await (await fetch(audioDataUri)).blob();
      const storagePath = `scribe-audio/${user.uid}/${Date.now()}_es.webm`;
      const audioUrl = await uploadFile(storagePath, audioBlob, { contentType: 'audio/webm' });

      const updates = {
          transcription_es: translation,
          audioUrl_es: audioUrl,
          storagePath_es: storagePath
      };
      
      const entryRef = doc(db, 'users', user.uid, 'scribeEntries', entryId);
      updateDocumentNonBlocking(entryRef, updates);
  }

  const value = { scribeEntries, addScribeEntry, deleteScribeEntry, translateScribeEntry, loading };

  return (
    <MediScribeContext.Provider value={value}>
      {children}
    </MediScribeContext.Provider>
  );
}

export function useMediScribe() {
  const context = React.useContext(MediScribeContext);
  if (context === undefined) {
    throw new Error('useMediScribe must be used within a MediScribeProvider');
  }
  return context;
}
