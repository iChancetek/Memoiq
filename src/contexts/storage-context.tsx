'use client';

import * as React from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, type UploadMetadata } from 'firebase/storage';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from './auth-context';

interface StorageContextType {
  uploadFile: (path: string, file: Blob, metadata?: UploadMetadata) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  loading: boolean;
}

const StorageContext = React.createContext<StorageContextType | undefined>(undefined);
const storage = getStorage(firebaseApp);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const uploadFile = async (path: string, file: Blob, metadata?: UploadMetadata): Promise<string> => {
    if (!user) throw new Error("User not authenticated for file upload.");
    setLoading(true);
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (path: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated for file deletion.");
    setLoading(true);
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      // It's okay if the file doesn't exist, we can ignore that error.
      // @ts-ignore
      if (error.code !== 'storage/object-not-found') {
        console.error("Error deleting file:", error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const value = { uploadFile, deleteFile, loading };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = React.useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
