
'use server';

import { getServerFirebase } from '@/firebase/server';

/**
 * Exchanges a refresh token for a new access token from Google.
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    const tokenData = await response.json() as { access_token?: string; error?: any };

    if (!response.ok) {
        console.error('Failed to refresh access token:', tokenData);
        throw new Error('Could not refresh Google access token.');
    }

    if (!tokenData.access_token) {
        console.error('No access token in refresh response:', tokenData);
        throw new Error('Failed to obtain new access token from Google.');
    }

    return tokenData.access_token;
}


/**
 * Fetches data from a Google API endpoint, handling token refresh implicitly.
 */
async function fetchGoogleApi(userId: string, url: string) {
    const { firestore } = getServerFirebase();
    const fetch = (await import('node-fetch')).default;
    
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User document not found.');
    }
    const refreshToken = userDoc.data()?.integrations?.google?.refreshToken;
    if (!refreshToken) {
        throw new Error('Google refresh token is missing. Please try reconnecting your account.');
    }

    // Get a fresh access token for every API call
    const accessToken = await refreshAccessToken(refreshToken);

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

/**
 * Syncs Google Contacts to Firestore.
 */
export async function syncGoogleContacts(userId: string) {
    const { firestore } = getServerFirebase();
  
    try {
        const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,biographies';
        const data: any = await fetchGoogleApi(userId, contactsUrl);
        
        if (!data.connections || data.connections.length === 0) {
            console.log('No Google Contacts to sync.');
            return;
        }
        
        const contactsRef = firestore.collection('users').doc(userId).collection('contacts');
        const batch = firestore.batch();

        data.connections.forEach((person: any) => {
            const name = person.names?.[0]?.displayName;
            if (!name) return;

            const contactData: Omit<Contact, 'id'> = {
                userId: userId,
                name,
                email: person.emailAddresses?.[0]?.value || '',
                company: person.organizations?.[0]?.name || '',
                title: person.organizations?.[0]?.title || '',
                notes: person.biographies?.[0]?.value || '',
                lastContact: new Date().toISOString().split('T')[0],
                createdAt: new Date(),
            };
            
            const docRef = contactsRef.doc();
            batch.set(docRef, contactData);
        });

        await batch.commit();
        console.log(`✅ Synced ${data.connections.length} contacts`);
    } catch (error) {
        console.error('❌ Error syncing contacts:', error);
        throw error;
    }
}

/**
 * Syncs Google Calendar events to Firestore.
 */
export async function syncGoogleCalendar(userId: string) {
    const { firestore } = getServerFirebase();

    try {
        const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`;
        const data: any = await fetchGoogleApi(userId, calendarUrl);

        if (!data.items || data.items.length === 0) {
            console.log('No Google Calendar events to sync.');
            return;
        }

        const eventsRef = firestore.collection('users').doc(userId).collection('events');
        const batch = firestore.batch();

        data.items.forEach((event: any) => {
            if (!event.start?.dateTime || !event.end?.dateTime) {
                return;
            }
            
            const docRef = eventsRef.doc();
            batch.set(docRef, {
                userId: userId,
                title: event.summary || 'Untitled Event',
                startTime: new Date(event.start.dateTime),
                endTime: new Date(event.end.dateTime),
                location: event.location || '',
                createdAt: new Date(),
                googleEventId: event.id
            });
        });

        await batch.commit();
        console.log(`✅ Synced ${data.items.length} calendar events`);
    } catch (error) {
        console.error('❌ Error syncing calendar:', error);
        throw error;
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
