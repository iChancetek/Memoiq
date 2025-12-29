
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
import { firebaseApp } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserSettings: (settings: object) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
// Request access to Google Calendar and Contacts APIs
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
             setUser({ ...user, ...userDoc.data() } as AppUser);
        } else {
             setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = async (userCredential: any) => {
    const userDocRef = doc(firestore, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setUser({ ...userCredential.user, ...userDoc.data() } as AppUser);
    } else {
      setUser(userCredential.user);
    }
    router.push('/');
    setError(null);
  }

  const handleAuthError = (error: any) => {
     switch (error.code) {
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
        console.error(error);
    }
  }
  
  const createUserInFirestore = async (user: User, displayName?: string) => {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
          const newUser = {
              uid: user.uid,
              email: user.email,
              displayName: displayName || user.displayName,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              workspaceId: user.uid, // Simple 1-to-1 mapping
              settings: {
                  theme: 'dark',
                  language: 'en', // For AI
                  uiLanguage: 'en', // For UI
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
          await setDoc(userRef, newUser);
          if (displayName && user.displayName !== displayName) {
              await updateProfile(user, { displayName });
          }
          return newUser;
      }
      return userDoc.data();
  }

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, 'users', userCredential.user.uid), { lastLogin: serverTimestamp() }, { merge: true });
      handleAuthSuccess(userCredential);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firestoreUser = await createUserInFirestore(userCredential.user, displayName);
      await updateProfile(userCredential.user, { displayName });
      handleAuthSuccess({ ...userCredential, user: { ...userCredential.user, ...firestoreUser }});
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firestoreUser = await createUserInFirestore(userCredential.user);
      
      const additionalInfo = getAdditionalUserInfo(userCredential);
      const accessToken = (additionalInfo?.credential as any)?.accessToken;

      if (accessToken) {
        const userRef = doc(firestore, 'users', userCredential.user.uid);
        await updateDoc(userRef, {
            'integrations.google.calendar': 'connected',
            'integrations.google.contacts': 'connected',
            'integrations.google.accessToken': accessToken,
        });
        
        setUser(prevUser => ({
            ...prevUser!,
            ...userCredential.user,
            ...firestoreUser,
            integrations: {
                ...prevUser?.integrations,
                google: {
                    calendar: 'connected',
                    contacts: 'connected',
                    accessToken: accessToken,
                }
            }
        }));
      }

      handleAuthSuccess({ ...userCredential, user: { ...userCredential.user, ...firestoreUser }});
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserProfile = async (profile: { displayName?: string; photoURL?: string }) => {
    if (user) {
        setLoading(true);
        try {
            await updateProfile(user, profile);
            await setDoc(doc(firestore, 'users', user.uid), profile, { merge: true });
            setUser({ ...user, ...profile });
            setError(null);
        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (user) {
        setLoading(true);
        try {
            await updatePassword(user, newPassword);
            setError(null);
        } catch (err) {
            handleAuthError(err);
            throw err; // Re-throw to be caught in the component
        } finally {
            setLoading(false);
        }
    }
  };

  const updateUserSettings = async (settings: object) => {
      if (user) {
          setLoading(true);
          try {
              const userRef = doc(firestore, 'users', user.uid);
              await updateDoc(userRef, { settings: { ...user.settings, ...settings} });
              setUser(prevUser => ({ ...prevUser!, settings: { ...prevUser!.settings, ...settings } }));
              setError(null);
          } catch (err) {
              handleAuthError(err);
          } finally {
              setLoading(false);
          }
      }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/auth');
      setUser(null);
      setError(null);
    } catch (err) {
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
