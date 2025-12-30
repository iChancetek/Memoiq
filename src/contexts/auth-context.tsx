
'use client';

import * as React from 'react';
import {
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
  type Auth,
  type UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';

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
            refreshToken?: string | null,
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
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline', // Request a refresh token
});


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const { auth, firestore } = useFirebase();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
             setUser({ ...user, ...userDoc.data() } as AppUser);
        } else {
             // This case is for a user that exists in Auth but not Firestore.
             // It can happen if document creation fails. We'll attempt to create it.
             // However, the main creation path is now in handleAuthSuccess.
             await handleAuthSuccess({ user } as UserCredential);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, firestore]);

  const handleAuthError = (err: any) => {
    setLoading(false);
    
    if (err.code === 'auth/popup-closed-by-user') {
        setError(null);
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
        setError('Please log out and log back in to complete this action.');
        break;
      case 'permission-denied':
         setError('Missing or insufficient permissions.');
         break;
      default:
        setError('An unexpected error occurred. Please try again.');
    }
  }

  const handleAuthSuccess = async (userCredential: UserCredential, additionalData = {}) => {
      const user = userCredential.user;
      const userRef = doc(firestore, 'users', user.uid);
      
      const additionalInfo = getAdditionalUserInfo(userCredential);

      // Only create a new document if the user is new.
      if (additionalInfo?.isNewUser) {
          const newUserPayload = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
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
                refreshToken: null,
              }
            },
            ...additionalData,
        };
        await setDoc(userRef, newUserPayload);
        setUser({ ...user, ...newUserPayload } as AppUser);
      } else {
        // For existing users, just fetch their data as the onAuthStateChanged will handle it.
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()){
            setUser({ ...user, ...userDoc.data()} as AppUser)
        }
      }

      router.push('/dashboard');
      setLoading(false);
  }

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
      await updateProfile(userCredential.user, { displayName });
      await handleAuthSuccess(userCredential, { displayName });
    } catch (err) {
      handleAuthError(err);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const additionalInfo = getAdditionalUserInfo(userCredential);
        // @ts-ignore - 'refreshToken' is not in the type, but it is available for offline access
        const refreshToken = additionalInfo?.profile?.refreshToken || userCredential._tokenResponse.refreshToken;

        const userRef = doc(firestore, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userRef);

        const integrationsUpdate = refreshToken ? {
            'integrations.google': {
                calendar: 'connected',
                contacts: 'connected',
                refreshToken: refreshToken,
            }
        } : {};

        if (userDoc.exists()) {
             await updateDoc(userRef, { lastLogin: serverTimestamp(), ...integrationsUpdate });
        }
        
        await handleAuthSuccess(userCredential, integrationsUpdate);

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
              calendar: 'disconnected',
              contacts: 'disconnected',
              refreshToken: null,
          };
          await updateDoc(userRef, { 'integrations.google': updatedIntegrations });
          
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
    if (auth.currentUser) {
        setLoading(true);
        setError(null);
        try {
            await updateProfile(auth.currentUser, profile);
            await setDoc(doc(firestore, 'users', auth.currentUser.uid), profile, { merge: true });
            setUser({ ...user!, ...profile });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (auth.currentUser) {
        setLoading(true);
        setError(null);
        try {
            await updatePassword(auth.currentUser, newPassword);
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
