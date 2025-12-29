
'use client';

import * as React from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  getAdditionalUserInfo,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';

const { auth, firestore } = initializeFirebase();

export interface AppUser extends User {
    settings?: {
        theme?: string;
        language?: 'en' | 'es';
        uiLanguage?: 'en' | 'es';
        notifications?: boolean;
        enableVoiceGreeting?: boolean;
    },
    integrations?: {
        google?: {
            calendar: 'connected' | 'disconnected',
            contacts: 'connected' | 'disconnected',
            accessToken?: string,
        }
    }
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserSettings: (settings: object) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
             setUser({ ...user, ...userDoc.data() } as AppUser);
        } else {
             try {
                const firestoreUser = await createUserInFirestore(user, user.displayName || '');
                setUser({ ...user, ...firestoreUser } as AppUser);
             } catch (e) {
                console.error("Failed to create user document for existing auth user:", e);
                setUser(user as AppUser);
             }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (err: any) => {
    setLoading(false);
    if (err.code === 'auth/popup-closed-by-user') {
        return;
    }
    switch (err.code) {
      case 'auth/user-not-found':
        setError('No account found with this email.');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password. Please try again.');
        break;
      case 'auth/email-already-in-use':
        setError('This email is already registered.');
        break;
       case 'auth/weak-password':
        setError('Password should be at least 6 characters.');
        break;
      case 'auth/requires-recent-login':
        setError('Please log out and log back in to change your password.');
        break;
      default:
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
    }
  }
  
  const createUserInFirestore = async (user: User, displayName?: string | null) => {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
          await updateDoc(userRef, { lastLogin: serverTimestamp() });
          return userDoc.data();
      }

      const newUserPayload = {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          displayName: displayName || user.displayName || 'User',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          settings: {
              theme: 'dark',
              language: 'en',
              uiLanguage: 'en',
              notifications: true,
              enableVoiceGreeting: true,
          },
          integrations: {
            google: {
              calendar: 'disconnected',
              contacts: 'disconnected',
            }
          }
      };
      await setDoc(userRef, newUserPayload);

      if (displayName && user.displayName !== displayName) {
          await updateProfile(user, { displayName });
      }
      
      return newUserPayload;
  }

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await updateDoc(doc(firestore, 'users', userCredential.user.uid), { lastLogin: serverTimestamp() });
      const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      setUser({ ...userCredential.user, ...userDoc.data() } as AppUser);
      router.push('/');
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firestoreData = await createUserInFirestore(userCredential.user, displayName);
      setUser({ ...userCredential.user, displayName, ...firestoreData } as AppUser);
      router.push('/');
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      
      await createUserInFirestore(firebaseUser, firebaseUser.displayName);
      
      const additionalInfo = getAdditionalUserInfo(userCredential);
      const accessToken = (additionalInfo?.credential as any)?.accessToken;

      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const updatedIntegrations = {
          google: {
              calendar: 'connected',
              contacts: 'connected',
              accessToken: accessToken || null,
          }
      };
      
      await updateDoc(userRef, {
          integrations: updatedIntegrations,
          lastLogin: serverTimestamp(),
      });
      
      const updatedUserDoc = await getDoc(userRef);
      setUser({ ...firebaseUser, ...updatedUserDoc.data() } as AppUser);
      
      router.push('/');

    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const disconnectGoogle = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
          const userRef = doc(firestore, 'users', user.uid);
          const updatedIntegrations = {
              ...(user.integrations || {}),
              google: {
                  calendar: 'disconnected',
                  contacts: 'disconnected',
                  accessToken: null,
              }
          };
          await updateDoc(userRef, { integrations: updatedIntegrations });
          setUser(prev => ({...prev!, integrations: updatedIntegrations} as AppUser));
      } catch (err: any) {
          handleAuthError(err);
      } finally {
          setLoading(false);
      }
  };
  
  const updateUserProfile = async (profile: { displayName?: string; photoURL?: string }) => {
    if (user) {
        setLoading(true);
        setError(null);
        try {
            await updateProfile(user, profile);
            await setDoc(doc(firestore, 'users', user.uid), profile, { merge: true });
            setUser({ ...user, ...profile });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (user) {
        setLoading(true);
        setError(null);
        try {
            await updatePassword(user, newPassword);
        } catch (err: any) {
            handleAuthError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }
  };

  const updateUserSettings = async (settings: object) => {
      if (user) {
          setLoading(true);
          setError(null);
          try {
              const userRef = doc(firestore, 'users', user.uid);
              await updateDoc(userRef, { settings: { ...user.settings, ...settings} });
              setUser(prevUser => ({ ...prevUser!, settings: { ...prevUser!.settings, ...settings } }));
          } catch (err: any) {
              handleAuthError(err);
          } finally {
              setLoading(false);
          }
      }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      router.push('/auth');
      setUser(null);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    loginWithGoogle,
    disconnectGoogle,
    updateUserProfile,
    updateUserPassword,
    updateUserSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    