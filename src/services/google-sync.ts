
'use server';

import { getFirestore, collection, writeBatch, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { getAuth } from 'firebase/auth';
import type { Contact, CalendarEvent } from '@/lib/data';
import fetch from 'node-fetch';

const { firestore } = initializeFirebase();
const auth = getAuth();

/**
 * Fetches data from a Google API endpoint.
 * @param url The Google API URL to fetch.
 * @param accessToken The user's Google OAuth2 access token.
 * @returns The JSON response from the API.
 */
async function fetchGoogleApi(url: string, accessToken: string) {
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
 * @param accessToken The user's Google OAuth2 access token.
 */
export async function syncGoogleContacts(accessToken: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,biographies';
    const data: any = await fetchGoogleApi(contactsUrl, accessToken);
    
    if (!data.connections || data.connections.length === 0) {
        console.log('No Google Contacts to sync.');
        return;
    }

    const contactsCollectionRef = collection(firestore, 'users', user.uid, 'contacts');
    const batch = writeBatch(firestore);

    data.connections.forEach((person: any) => {
        const name = person.names?.[0]?.displayName;
        if (!name) return; // Skip contacts without a name

        const contactData: Omit<Contact, 'id'> = {
            userId: user.uid,
            name,
            email: person.emailAddresses?.[0]?.value || '',
            company: person.organizations?.[0]?.name || '',
            title: person.organizations?.[0]?.title || '',
            notes: person.biographies?.[0]?.value || '',
            lastContact: new Date().toISOString().split('T')[0], // Default to today
            createdAt: serverTimestamp(),
        };
        
        // In a real app, you'd want to check for existing contacts to update
        // instead of just adding new ones. For simplicity, we add new ones.
        const docRef = doc(contactsCollectionRef); // Create a new doc
        batch.set(docRef, contactData);
    });

    await batch.commit();
}


/**
 * Syncs Google Calendar events to Firestore.
 * @param accessToken The user's Google OAuth2 access token.
 */
export async function syncGoogleCalendar(accessToken: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=250`;
    const data: any = await fetchGoogleApi(calendarUrl, accessToken);

    if (!data.items || data.items.length === 0) {
        console.log('No Google Calendar events to sync.');
        return;
    }

    const eventsCollectionRef = collection(firestore, 'users', user.uid, 'events');
    const batch = writeBatch(firestore);

    data.items.forEach((event: any) => {
        if (!event.start?.dateTime || !event.end?.dateTime) {
            return; // Skip all-day events for now
        }

        const eventData: Omit<CalendarEvent, 'id'> = {
            userId: user.uid,
            title: event.summary || 'No Title',
            startTime: new Date(event.start.dateTime),
            endTime: new Date(event.end.dateTime),
            location: event.location || '',
            createdAt: serverTimestamp(),
        };

        const docRef = doc(eventsCollectionRef); // Create new doc
        batch.set(docRef, eventData);
    });

    await batch.commit();
}
