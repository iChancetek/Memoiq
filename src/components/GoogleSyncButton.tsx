'use client';

import { useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { syncGoogleContacts, syncGoogleCalendar } from '@/services/google-sync';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

export default function GoogleSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  
  const { auth } = initializeFirebase();

  async function handleSync() {
    setSyncing(true);
    setMessage('');
    
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
      
      // Sync calendar
      setMessage('📅 Syncing calendar...');
      const calendarResult = await syncGoogleCalendar(user.uid, accessToken);
      
      if (contactsResult.success && calendarResult.success) {
        setMessage(`✅ Success! Synced ${contactsResult.count} contacts and ${calendarResult.count} events`);
      } else {
        setMessage(`⚠️ Partial sync: ${contactsResult.message}, ${calendarResult.message}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setMessage('❌ Sync cancelled');
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium">Google Sync</h3>
        <p className="text-sm text-muted-foreground">
            Manually sync your Google Contacts and Calendar events with MemoIQ. You will be asked to re-authorize with Google.
        </p>
      <Button
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? <Loader2 className="animate-spin mr-2" /> : '🔄'}
        {syncing ? message || 'Syncing...' : 'Sync Google Contacts & Calendar'}
      </Button>
      {message && !syncing && (
        <p className={`text-sm ${message.startsWith('❌') || message.startsWith('⚠️') ? 'text-destructive' : 'text-muted-foreground'}`}>
          {message}
        </p>
      )}
    </div>
  );
}