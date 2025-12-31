'use server';

import { getServerFirebase } from '@/firebase/server';

/**
 * Fetches data from a Google API endpoint.
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

/**
 * Syncs Google Contacts to Firestore using a provided access token.
 */
export async function syncGoogleContacts(userId: string, accessToken: string) {
    const { firestore } = getServerFirebase();
  
    try {
        const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,biographies';
        const data: any = await fetchGoogleApi(contactsUrl, accessToken);
        
        if (!data.connections || data.connections.length === 0) {
            console.log('No Google Contacts to sync.');
            return { success: true, count: 0, message: 'No contacts found' };
        }
        
        const contactsRef = firestore.collection('users').doc(userId).collection('contacts');
        
        // Delete old contacts first
        const existingContacts = await contactsRef.get();
        const deleteBatch = firestore.batch();
        existingContacts.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        if (existingContacts.size > 0) {
            await deleteBatch.commit();
        }
        
        // Add new contacts
        const batch = firestore.batch();
        let addedCount = 0;

        data.connections.forEach((person: any) => {
            const name = person.names?.[0]?.displayName;
            if (!name) return;

            const contactData = {
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
            addedCount++;
        });

        if (addedCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ Synced ${addedCount} contacts`);
        return { success: true, count: addedCount, message: `Synced ${addedCount} contacts` };
    } catch (error: any) {
        console.error('❌ Error syncing contacts:', error);
        return { success: false, count: 0, message: error.message || 'Failed to sync contacts' };
    }
}

/**
 * Syncs Google Calendar events to Firestore using a provided access token.
 */
export async function syncGoogleCalendar(userId: string, accessToken: string) {
    const { firestore } = getServerFirebase();

    try {
        const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`;
        const data: any = await fetchGoogleApi(calendarUrl, accessToken);

        if (!data.items || data.items.length === 0) {
            console.log('No Google Calendar events to sync.');
            return { success: true, count: 0, message: 'No events found' };
        }

        const eventsRef = firestore.collection('users').doc(userId).collection('events');
        
        // Delete old events first
        const existingEvents = await eventsRef.get();
        const deleteBatch = firestore.batch();
        existingEvents.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        if (existingEvents.size > 0) {
            await deleteBatch.commit();
        }
        
        // Add new events
        const batch = firestore.batch();
        let addedCount = 0;

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
            addedCount++;
        });

        if (addedCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ Synced ${addedCount} calendar events`);
        return { success: true, count: addedCount, message: `Synced ${addedCount} events` };
    } catch (error: any) {
        console.error('❌ Error syncing calendar:', error);
        return { success: false, count: 0, message: error.message || 'Failed to sync calendar events' };
    }
}