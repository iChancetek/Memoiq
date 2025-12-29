
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
            accessToken?: string | null,
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
             // This case can happen if a user is authenticated but their Firestore doc was deleted.
             // We'll re-create it.
             try {
                const firestoreUser = await createUserInFirestore(user, user.displayName || '');
                setUser({ ...user, ...firestoreUser } as AppUser);
             } catch (e) {
                console.error("Failed to create user document for existing auth user:", e);
                setUser(user as AppUser); // Fallback to auth user object
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
    // This error code means the user closed the pop-up.
    // It's not a true "error" we need to show the user.
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

      // If the user document already exists, just update the last login time.
      if (userDoc.exists()) {
          await updateDoc(userRef, { lastLogin: serverTimestamp() });
          return userDoc.data();
      }

      // If the document doesn't exist, create it with default settings.
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

      // Also ensure the auth profile's display name is consistent.
      if (displayName && user.displayName !== displayName) {
          await updateProfile(user, { displayName });
      }
      
      return newUserPayload;
  }

  const handleAuthSuccess = async (userCredential: any) => {
    const firebaseUser = userCredential.user;
    let firestoreData = await createUserInFirestore(firebaseUser, firebaseUser.displayName);

    // If it's a Google sign-in, update integrations.
    const additionalInfo = getAdditionalUserInfo(userCredential);
    if (additionalInfo?.providerId === 'google.com') {
      const accessToken = (additionalInfo?.credential as any)?.accessToken;
      const updatedIntegrations = {
        google: {
          calendar: 'connected',
          contacts: 'connected',
          accessToken: accessToken || null,
        }
      };
      await updateDoc(doc(firestore, 'users', firebaseUser.uid), {
        'integrations.google': updatedIntegrations.google,
        lastLogin: serverTimestamp(),
      });
      firestoreData = { ...firestoreData, integrations: updatedIntegrations };
    }
    
    setUser({ ...firebaseUser, ...firestoreData } as AppUser);
    router.push('/');
    setLoading(false);
  };


  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(userCredential);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // We need to update the profile displayName right after creation.
      await updateProfile(userCredential.user, { displayName });
      await handleAuthSuccess(userCredential);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await handleAuthSuccess(userCredential);
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
          // Create the update payload specifically for the google integration part
          const updatedIntegrations = {
              calendar: 'disconnected',
              contacts: 'disconnected',
              accessToken: null,
          };
          await updateDoc(userRef, { 'integrations.google': updatedIntegrations });
          
          // Update local user state to reflect the change immediately
          setUser(prevUser => {
              if (!prevUser) return null;
              const newIntegrationsState = {
                  ...prevUser.integrations,
                  google: updatedIntegrations,
              };
              return { ...prevUser, integrations: newIntegrationsState } as AppUser;
          });

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
