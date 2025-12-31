
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


/**
 * Syncs recent Google Emails to Firestore.
 */
export async function syncGoogleEmails(userId: string, accessToken: string) {
    const { firestore } = getServerFirebase();
  
    try {
        // 1. Get list of recent message IDs
        const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=is:inbox';
        const listData: any = await fetchGoogleApi(listUrl, accessToken);

        if (!listData.messages || listData.messages.length === 0) {
            console.log('No Google Emails to sync.');
            return { success: true, count: 0, message: 'No emails found' };
        }

        // 2. Fetch details for each message
        const emailsRef = firestore.collection('users').doc(userId).collection('emails');
        const batch = firestore.batch();
        let addedCount = 0;
        
        for (const message of listData.messages) {
            const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From,Subject,Date`;
            const emailData: any = await fetchGoogleApi(messageUrl, accessToken);
            
            const findHeader = (name: string) => emailData.payload.headers.find((h: any) => h.name === name)?.value || '';

            const emailDoc = {
                userId: userId,
                from: findHeader('From'),
                subject: findHeader('Subject'),
                snippet: emailData.snippet,
                receivedAt: new Date(findHeader('Date')),
                createdAt: new Date(),
                gmailId: emailData.id,
            };
            
            // Use the Gmail ID as the document ID to prevent duplicates
            const docRef = emailsRef.doc(emailData.id);
            batch.set(docRef, emailDoc, { merge: true }); // Use merge to update existing
            addedCount++;
        }

        if (addedCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ Synced ${addedCount} emails`);
        return { success: true, count: addedCount, message: `Synced ${addedCount} emails` };
    } catch (error: any) {
        console.error('❌ Error syncing emails:', error);
        return { success: false, count: 0, message: error.message || 'Failed to sync emails' };
    }
}
