
'use server';

import { collection, writeBatch, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { getServerFirebase } from '@/firebase/server';

/**
 * Fetches data from a Google API endpoint.
 * @param url The Google API URL to fetch.
 * @param accessToken The user's Google OAuth2 access token.
 * @returns The JSON response from the API.
 */
async function fetchGoogleApi(url: string, accessToken: string) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google API Error:', errorData);
        throw new Error(`Google API request failed: ${response.statusText}`);
    }

    return response.json();
}

async function getAccessToken(userId: string): Promise<string> {
    const { firestore } = getServerFirebase();
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error('User document not found.');
    }
    const accessToken = userDoc.data()?.integrations?.google?.accessToken;
    if (!accessToken) {
        throw new Error('Google access token is missing. Please try reconnecting your account');
    }
    return accessToken;
}

/**
 * Syncs Google Contacts to Firestore.
 * @param userId The ID of the user to sync contacts for.
 */
export async function syncGoogleContacts(userId: string) {
    const { firestore } = getServerFirebase();
  
    try {
        const accessToken = await getAccessToken(userId);
        
        const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,biographies';
        const data: any = await fetchGoogleApi(contactsUrl, accessToken);
        
        if (!data.connections || data.connections.length === 0) {
            console.log('No Google Contacts to sync.');
            return;
        }
        
        const contactsRef = collection(firestore, 'users', userId, 'contacts');
        const batch = writeBatch(firestore);

        data.connections.forEach((person: any) => {
            const name = person.names?.[0]?.displayName;
            if (!name) return; // Skip contacts without a name

            const contactData: Omit<Contact, 'id'> = {
                userId: userId,
                name,
                email: person.emailAddresses?.[0]?.value || '',
                company: person.organizations?.[0]?.name || '',
                title: person.organizations?.[0]?.title || '',
                notes: person.biographies?.[0]?.value || '',
                lastContact: new Date().toISOString().split('T')[0], // Default to today
                createdAt: serverTimestamp(),
            };
            
            const docRef = doc(contactsRef);
            batch.set(docRef, contactData);
        });

        await batch.commit();
        console.log(`✅ Synced ${data.connections.length} contacts`);
    } catch (error) {
        console.error('❌ Error syncing contacts:', error);
    }
}


/**
 * Syncs Google Calendar events to Firestore.
 * @param userId The ID of the user to sync events for.
 */
export async function syncGoogleCalendar(userId: string) {
    const { firestore } = getServerFirebase();

    try {
        const accessToken = await getAccessToken(userId);

        const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`;
        const data: any = await fetchGoogleApi(calendarUrl, accessToken);

        if (!data.items || data.items.length === 0) {
            console.log('No Google Calendar events to sync.');
            return;
        }

        const eventsRef = collection(firestore, 'users', userId, 'events');
        const batch = writeBatch(firestore);

        data.items.forEach((event: any) => {
            if (!event.start?.dateTime || !event.end?.dateTime) {
                return; // Skip all-day events for now
            }
            
            const docRef = doc(eventsRef);
            batch.set(docRef, {
                userId: userId,
                title: event.summary || 'Untitled Event',
                startTime: new Date(event.start.dateTime),
                endTime: new Date(event.end.dateTime),
                location: event.location || '',
                createdAt: serverTimestamp(),
                googleEventId: event.id
            });
        });

        await batch.commit();
        console.log(`✅ Synced ${data.items.length} calendar events`);
    } catch (error) {
        console.error('❌ Error syncing calendar:', error);
    }
}

interface Contact {
    userId: string;
    name: string;
    email: string;
    company: string;
    title: string;
    notes: string;
    lastContact: string;
    createdAt: any;
}
