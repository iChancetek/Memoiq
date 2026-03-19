
'use client';

import * as React from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
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

export interface GoogleAccount {
    email: string;
    displayName: string;
    photoURL?: string;
    refreshToken: string;
    status: 'connected' | 'disconnected';
    lastSync?: any; // Firestore Timestamp
}

export interface MicrosoftAccount {
    email: string;
    displayName: string;
    photoURL?: string;
    refreshToken: string;
    status: 'connected' | 'disconnected';
    lastSync?: any; // Firestore Timestamp
}

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
            gmail: 'connected' | 'disconnected',
            refreshToken?: string | null,
        },
        googleAccounts?: {
            [email: string]: GoogleAccount;
        },
        microsoft?: {
            calendar: 'connected' | 'disconnected',
            contacts: 'connected' | 'disconnected',
            outlook: 'connected' | 'disconnected',
            refreshToken?: string | null,
        },
        microsoftAccounts?: {
            [email: string]: MicrosoftAccount;
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
  addGoogleAccount: (account: GoogleAccount) => Promise<void>;
  removeGoogleAccount: (email: string) => Promise<void>;
  addMicrosoftAccount: (account: MicrosoftAccount) => Promise<void>;
  removeMicrosoftAccount: (email: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  disconnectMicrosoft: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserSettings: (settings: object) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.setCustomParameters({
  access_type: 'offline', // Request a refresh token
  prompt: 'consent',
});

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('openid');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('offline_access');
microsoftProvider.addScope('Mail.ReadWrite');
microsoftProvider.addScope('Calendars.ReadWrite');
microsoftProvider.addScope('Contacts.ReadWrite');
microsoftProvider.setCustomParameters({
  prompt: 'consent',
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
                gmail: 'disconnected',
                refreshToken: null,
              },
              microsoft: {
                calendar: 'disconnected',
                contacts: 'disconnected',
                outlook: 'disconnected',
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
        
        // This is an internal property but the only reliable way to get the RT on the client
        // @ts-ignore
        const refreshToken = userCredential?._tokenResponse?.refreshToken;

        const userRef = doc(firestore, 'users', userCredential.user.uid);
        
        // Prepare the update payload. Only update if we get a refresh token.
        const integrationsUpdate: any = {};
        if (refreshToken) {
            integrationsUpdate['integrations.google'] = {
                calendar: 'connected',
                contacts: 'connected',
                gmail: 'connected',
                refreshToken: refreshToken,
            };
        } else {
             integrationsUpdate['integrations.google.calendar'] = 'connected';
             integrationsUpdate['integrations.google.contacts'] = 'connected';
             integrationsUpdate['integrations.google.gmail'] = 'connected';
        }

        await updateDoc(userRef, { lastLogin: serverTimestamp(), ...integrationsUpdate });

        await handleAuthSuccess(userCredential);

    } catch (err: any) {
        handleAuthError(err);
    }
  };
  
  const loginWithMicrosoft = async () => {
    setLoading(true);
    setError(null);
    try {
        const userCredential = await signInWithPopup(auth, microsoftProvider);
        
        // OAuthProvider gives access to the credential which contains the tokens
        const credential = OAuthProvider.credentialFromResult(userCredential);
        const accessToken = credential?.accessToken;
        const refreshToken = (userCredential as any)?._tokenResponse?.refreshToken;

        const userRef = doc(firestore, 'users', userCredential.user.uid);
        
        const integrationsUpdate: any = {};
        if (refreshToken) {
            integrationsUpdate['integrations.microsoft'] = {
                calendar: 'connected',
                contacts: 'connected',
                outlook: 'connected',
                refreshToken: refreshToken,
            };
        } else {
             integrationsUpdate['integrations.microsoft.calendar'] = 'connected';
             integrationsUpdate['integrations.microsoft.contacts'] = 'connected';
             integrationsUpdate['integrations.microsoft.outlook'] = 'connected';
        }

        await updateDoc(userRef, { lastLogin: serverTimestamp(), ...integrationsUpdate });
        await handleAuthSuccess(userCredential);

    } catch (err: any) {
        handleAuthError(err);
    }
  };

  const disconnectMicrosoft = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
          const userRef = doc(firestore, 'users', user.uid);
          const updatedIntegrations = {
              calendar: 'disconnected',
              contacts: 'disconnected',
              outlook: 'disconnected',
              refreshToken: null,
          };
          await updateDoc(userRef, { 'integrations.microsoft': updatedIntegrations });
          
          setUser(prevUser => {
              if (!prevUser) return null;
              const newIntegrationsState = {
                  ...prevUser.integrations,
                  microsoft: updatedIntegrations,
              };
              return { ...prevUser, integrations: newIntegrationsState } as AppUser;
          });

      } catch (err: any) {
          handleAuthError(err);
      } finally {
          setLoading(false);
      }
  };

  const addGoogleAccount = async (account: GoogleAccount) => {
    if (user) {
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const updatedGoogleAccounts = {
                ...(user.integrations?.googleAccounts || {}),
                [account.email]: account
            };
            await updateDoc(userRef, { 'integrations.googleAccounts': updatedGoogleAccounts });
            
            setUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    integrations: {
                        ...prevUser.integrations,
                        googleAccounts: updatedGoogleAccounts
                    }
                } as AppUser;
            });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
  };

  const removeGoogleAccount = async (email: string) => {
    if (user) {
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const updatedGoogleAccounts = { ...(user.integrations?.googleAccounts || {}) };
            delete updatedGoogleAccounts[email];
            
            await updateDoc(userRef, { 'integrations.googleAccounts': updatedGoogleAccounts });
            
            setUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    integrations: {
                        ...prevUser.integrations,
                        googleAccounts: updatedGoogleAccounts
                    }
                } as AppUser;
            });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
  };
  
  const addMicrosoftAccount = async (account: MicrosoftAccount) => {
    if (user) {
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const updatedMSAccounts = {
                ...(user.integrations?.microsoftAccounts || {}),
                [account.email.replace(/\./g, '_')]: account
            };
            await updateDoc(userRef, { 'integrations.microsoftAccounts': updatedMSAccounts });
            
            setUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    integrations: {
                        ...prevUser.integrations,
                        microsoftAccounts: updatedMSAccounts
                    }
                } as AppUser;
            });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
  };

  const removeMicrosoftAccount = async (email: string) => {
    if (user) {
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const emailKey = email.replace(/\./g, '_');
            const updatedMSAccounts = { ...(user.integrations?.microsoftAccounts || {}) };
            delete updatedMSAccounts[emailKey];
            
            await updateDoc(userRef, { 'integrations.microsoftAccounts': updatedMSAccounts });
            
            setUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    integrations: {
                        ...prevUser.integrations,
                        microsoftAccounts: updatedMSAccounts
                    }
                } as AppUser;
            });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
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
              gmail: 'disconnected',
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
    addGoogleAccount,
    removeGoogleAccount,
    addMicrosoftAccount,
    removeMicrosoftAccount,
    loginWithMicrosoft,
    disconnectMicrosoft,
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
