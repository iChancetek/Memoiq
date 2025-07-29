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
  type User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user data from Firestore to get the full profile
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
             // @ts-ignore
             setUser({ ...user, ...userDoc.data() });
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

  const handleAuthSuccess = (userCredential: any) => {
    setUser(userCredential.user);
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
          await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: displayName || user.displayName,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              workspaceId: user.uid, // Simple 1-to-1 mapping
              settings: {
                  theme: 'dark',
                  language: 'en',
                  notifications: true,
                  enableVoiceGreeting: true,
              }
          });
          // Also update the auth profile if a new display name was provided during signup
          if (displayName && user.displayName !== displayName) {
              await updateProfile(user, { displayName });
          }
      }
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
      await createUserInFirestore(userCredential.user, displayName);
      await updateProfile(userCredential.user, { displayName });
      handleAuthSuccess({ ...userCredential, user: { ...userCredential.user, displayName }});
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
      await createUserInFirestore(userCredential.user);
      handleAuthSuccess(userCredential);
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
  }

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
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
