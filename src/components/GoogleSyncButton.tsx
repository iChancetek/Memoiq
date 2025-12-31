
'use client';

import { useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { syncGoogleContacts, syncGoogleCalendar, syncGoogleEmails } from '@/services/google-sync';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function GoogleSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [apiError, setApiError] = useState(false);
  
  const { auth } = initializeFirebase();

  async function handleSync() {
    setSyncing(true);
    setMessage('');
    setApiError(false);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('❌ Please sign in first');
        setSyncing(false);
        return;
      }

      // Get fresh Google access token via popup
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      
      setMessage('🔐 Authorizing with Google...');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      if (!accessToken) {
        throw new Error('Failed to get access token from Google');
      }

      // Sync contacts
      setMessage('📇 Syncing contacts...');
      const contactsResult = await syncGoogleContacts(user.uid, accessToken);
      if (!contactsResult.success && contactsResult.message?.includes('Forbidden')) {
          setApiError(true);
          throw new Error('API access forbidden. Please enable the required APIs.');
      }
      
      // Sync calendar
      setMessage('📅 Syncing calendar...');
      const calendarResult = await syncGoogleCalendar(user.uid, accessToken);
       if (!calendarResult.success && calendarResult.message?.includes('Forbidden')) {
          setApiError(true);
          throw new Error('API access forbidden. Please enable the required APIs.');
      }

      // Sync emails
      setMessage('✉️ Syncing emails...');
      const emailsResult = await syncGoogleEmails(user.uid, accessToken);
      if (!emailsResult.success && emailsResult.message?.includes('Forbidden')) {
        setApiError(true);
        throw new Error('API access forbidden. Please enable the required APIs.');
      }
      
      if (contactsResult.success && calendarResult.success && emailsResult.success) {
        setMessage(`✅ Success! Synced ${contactsResult.count} contacts, ${calendarResult.count} events, and ${emailsResult.count} emails.`);
      } else {
        const errorMessages = [contactsResult.message, calendarResult.message, emailsResult.message].filter(Boolean).join(', ');
        setMessage(`⚠️ Partial sync: ${errorMessages}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setMessage('❌ Sync cancelled');
      } else if (!apiError) { // Don't show generic error if it's a specific API error
        setMessage(`❌ Error: ${error.message}`);
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
            Manually sync your Google Contacts, Calendar, and Emails with MemoIQ. You will be asked to re-authorize with Google.
        </p>
        {apiError && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>API Access Forbidden</AlertTitle>
                <AlertDescription>
                    <p>One or more required Google APIs are not enabled for your project. Please enable them in your Google Cloud Console to proceed.</p>
                    <div className="mt-2 space-y-1">
                        <Button variant="link" size="sm" asChild className="p-0 h-auto">
                            <Link href="https://console.cloud.google.com/apis/library/people.googleapis.com" target="_blank">
                                Enable People API <ExternalLink className="ml-1 h-3 w-3"/>
                            </Link>
                        </Button>
                         <Button variant="link" size="sm" asChild className="p-0 h-auto block">
                            <Link href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank">
                                Enable Google Calendar API <ExternalLink className="ml-1 h-3 w-3"/>
                            </Link>
                        </Button>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto block">
                            <Link href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank">
                                Enable Gmail API <ExternalLink className="ml-1 h-3 w-3"/>
                            </Link>
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        )}
      <Button
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? <Loader2 className="animate-spin mr-2" /> : '🔄'}
        {syncing ? message || 'Syncing...' : 'Sync Google Data'}
      </Button>
      {message && !syncing && (
        <p className={`text-sm ${message.startsWith('❌') || message.startsWith('⚠️') ? 'text-destructive' : 'text-muted-foreground'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
