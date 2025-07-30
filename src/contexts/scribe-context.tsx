'use client';

import * as React from 'react';
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
import { useStorage } from './storage-context';
import { scribeTranscribeAndTranslate } from '@/ai/flows/scribe-transcribe-and-translate';

export interface ScribeEntry {
    id: string;
    userId: string;
    title: string;
    audioUrl: string;
    storagePath: string;
    transcription_en: string;
    transcription_es: string;
    createdAt: Timestamp;
}

interface ScribeContextType {
  scribeEntries: ScribeEntry[];
  addScribeEntry: (audioBlob: Blob) => Promise<void>;
  updateScribeEntry: (entryId: string, updates: Partial<ScribeEntry>) => Promise<void>;
  deleteScribeEntry: (entryId: string) => Promise<void>;
  translateScribeEntry: (entryId: string, targetLanguage: 'en' | 'es', text: string) => Promise<void>;
  loading: boolean;
}

const ScribeContext = React.createContext<ScribeContextType | undefined>(undefined);
const db = getFirestore(firebaseApp);

export function ScribeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { uploadFile, deleteFile } = useStorage();
  const [scribeEntries, setScribeEntries] = React.useState<ScribeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
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
  }, [user]);

  const addScribeEntry = async (audioBlob: Blob) => {
    if (!user) throw new Error("User not authenticated");

    // 1. Upload audio to Firebase Storage
    const fileExtension = audioBlob.type.split('/')[1] || 'webm';
    const storagePath = `scribe-audio/${user.uid}/${Date.now()}.${fileExtension}`;
    const audioUrl = await uploadFile(storagePath, audioBlob, { contentType: audioBlob.type });

    // 2. Convert blob to data URI for Genkit
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    const audioDataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
    });

    // 3. Get transcription and initial translation (to English) from AI
    const aiResult = await scribeTranscribeAndTranslate({
        audioDataUri,
        targetLanguage: 'en'
    });
    
    // 4. Save metadata to Firestore
    await addDoc(collection(db, 'users', user.uid, 'scribeEntries'), {
      userId: user.uid,
      title: `Recording - ${new Date().toLocaleString()}`,
      audioUrl,
      storagePath,
      transcription_en: aiResult.transcription, // Initially, both can be the same if source is English
      transcription_es: '', // Will be filled on demand
      createdAt: serverTimestamp(),
    });
  };

  const updateScribeEntry = async (entryId: string, updates: Partial<ScribeEntry>) => {
    if (!user) return;
    const entryRef = doc(db, 'users', user.uid, 'scribeEntries', entryId);
    await updateDoc(entryRef, updates);
  };
  
  const deleteScribeEntry = async (entryId: string) => {
    if (!user) return;
    const entry = scribeEntries.find(e => e.id === entryId);
    if (!entry) return;

    // Delete audio from storage
    await deleteFile(entry.storagePath);
    // Delete metadata from Firestore
    const entryRef = doc(db, 'users', user.uid, 'scribeEntries', entryId);
    await deleteDoc(entryRef);
  }

  const translateScribeEntry = async (entryId: string, targetLanguage: 'en' | 'es', text: string) => {
      if (!user) return;
      const entry = scribeEntries.find(e => e.id === entryId);
      if (!entry) return;

      // Get translation from AI
      const aiResult = await scribeTranscribeAndTranslate({
          // We pass the existing audio URI again; the flow is smart enough
          // but for optimization, we could have a translate-only flow.
          // For now, this is simpler. We pass the already-transcribed text to the prompt.
          audioDataUri: '', // This will be ignored if we just need translation
          targetLanguage
      });

      const { translation } = await translateScribeEntry(entryId, targetLanguage, text);

      // Update the entry in Firestore
      const fieldToUpdate = targetLanguage === 'es' ? 'transcription_es' : 'transcription_en';
      await updateScribeEntry(entryId, { [fieldToUpdate]: translation });
  }

  const value = { scribeEntries, addScribeEntry, updateScribeEntry, deleteScribeEntry, translateScribeEntry, loading };

  return (
    <ScribeContext.Provider value={value}>
      {children}
    </ScribeContext.Provider>
  );
}

export function useScribe() {
  const context = React.useContext(ScribeContext);
  if (context === undefined) {
    throw new Error('useScribe must be used within a ScribeProvider');
  }
  return context;
}
