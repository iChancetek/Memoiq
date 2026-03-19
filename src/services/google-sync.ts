'use server';

import { getServerFirebase } from '@/firebase/server';
import { getNewAccessToken } from './google-oauth';

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
        const errorData = await response.json().catch(() => ({}));
        console.error('Google API Error:', errorData);
        throw new Error(`Google API request failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Main entry point to sync a specific Google account.
 */
export async function syncGoogleAccount(userId: string, accountEmail: string) {
    const { firestore } = getServerFirebase();
    
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) throw new Error('User not found');
        
        const userData = userDoc.data();
        const emailKey = accountEmail.replace(/\./g, '_');
        const account = userData?.integrations?.googleAccounts?.[emailKey];
        
        if (!account || !account.refreshToken) {
            throw new Error(`No refresh token found for account: ${accountEmail}`);
        }
        
        // 1. Get a fresh access token
        const accessToken = await getNewAccessToken(account.refreshToken);
        
        // 2. Run syncs
        const contactsResult = await syncGoogleContacts(userId, accountEmail, accessToken);
        const calendarResult = await syncGoogleCalendar(userId, accountEmail, accessToken);
        const emailsResult = await syncGoogleEmails(userId, accountEmail, accessToken);
        
        // 3. Update last sync time
        await firestore.collection('users').doc(userId).update({
            [`integrations.googleAccounts.${emailKey}.lastSync`]: new Date()
        });
        
        return {
            success: true,
            summary: {
                contacts: contactsResult.count,
                calendar: calendarResult.count,
                emails: emailsResult.count
            }
        };
    } catch (error: any) {
        console.error(`Error syncing account ${accountEmail}:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Syncs Google Contacts to Firestore.
 */
export async function syncGoogleContacts(userId: string, accountEmail: string, accessToken: string) {
    const { firestore } = getServerFirebase();
  
    try {
        const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,biographies';
        const data: any = await fetchGoogleApi(contactsUrl, accessToken);
        
        if (!data.connections || data.connections.length === 0) {
            return { success: true, count: 0 };
        }
        
        const contactsRef = firestore.collection('users').doc(userId).collection('contacts');
        
        // Note: For now we're appending/upserting. 
        // In a real app, we might want to filter by account before deleting.
        
        const batch = firestore.batch();
        let addedCount = 0;

        data.connections.forEach((person: any) => {
            const name = person.names?.[0]?.displayName;
            if (!name) return;

            const email = person.emailAddresses?.[0]?.value || '';
            const contactData = {
                userId: userId,
                accountEmail: accountEmail,
                provider: 'google',
                name,
                email,
                company: person.organizations?.[0]?.name || '',
                title: person.organizations?.[0]?.title || '',
                notes: person.biographies?.[0]?.value || '',
                lastContact: new Date().toISOString().split('T')[0],
                createdAt: new Date(),
            };
            
            // Use a deterministic ID to avoid duplicates across syncs for the same account
            const docId = `google-${accountEmail}-${email || name}`.replace(/[^a-zA-Z0-9]/g, '-');
            const docRef = contactsRef.doc(docId);
            batch.set(docRef, contactData, { merge: true });
            addedCount++;
        });

        if (addedCount > 0) {
            await batch.commit();
        }
        
        return { success: true, count: addedCount };
    } catch (error: any) {
        console.error('Error syncing contacts:', error);
        return { success: false, count: 0, message: error.message };
    }
}

/**
 * Syncs Google Calendar events to Firestore.
 */
export async function syncGoogleCalendar(userId: string, accountEmail: string, accessToken: string) {
    const { firestore } = getServerFirebase();

    try {
        const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`;
        const data: any = await fetchGoogleApi(calendarUrl, accessToken);

        if (!data.items || data.items.length === 0) {
            return { success: true, count: 0 };
        }

        const eventsRef = firestore.collection('users').doc(userId).collection('events');
        const batch = firestore.batch();
        let addedCount = 0;

        data.items.forEach((event: any) => {
            if (!event.start?.dateTime || !event.end?.dateTime) return;
            
            const docId = `google-${accountEmail}-${event.id}`.replace(/[^a-zA-Z0-9]/g, '-');
            const docRef = eventsRef.doc(docId);
            batch.set(docRef, {
                userId: userId,
                accountEmail: accountEmail,
                provider: 'google',
                title: event.summary || 'Untitled Event',
                startTime: new Date(event.start.dateTime),
                endTime: new Date(event.end.dateTime),
                location: event.location || '',
                createdAt: new Date(),
                googleEventId: event.id
            }, { merge: true });
            addedCount++;
        });

        if (addedCount > 0) {
            await batch.commit();
        }
        
        return { success: true, count: addedCount };
    } catch (error: any) {
        console.error('Error syncing calendar:', error);
        return { success: false, count: 0, message: error.message };
    }
}


/**
 * Syncs recent Google Emails to Firestore.
 */
export async function syncGoogleEmails(userId: string, accountEmail: string, accessToken: string) {
    const { firestore } = getServerFirebase();
  
    try {
        const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=is:inbox';
        const listData: any = await fetchGoogleApi(listUrl, accessToken);

        if (!listData.messages || listData.messages.length === 0) {
            return { success: true, count: 0 };
        }

        const emailsRef = firestore.collection('users').doc(userId).collection('emails');
        const batch = firestore.batch();
        let addedCount = 0;
        
        for (const message of listData.messages) {
            const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`;
            const emailData: any = await fetchGoogleApi(messageUrl, accessToken);
            
            if (!emailData?.payload?.headers) continue;
            
            const findHeader = (name: string) => emailData.payload.headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

            const from = findHeader('From');
            const subject = findHeader('Subject');
            const date = findHeader('Date');

            if (!from || !subject || !date) continue; 
            
            let htmlBody = '';
            let textBody = '';

            const getPartBody = (part: any) => {
                if (part.body && part.body.data) {
                    return Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                return '';
            }

            if (emailData.payload.parts) {
                const htmlPart = emailData.payload.parts.find((p: any) => p.mimeType === 'text/html');
                const textPart = emailData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
                if (htmlPart) htmlBody = getPartBody(htmlPart);
                if (textPart) textBody = getPartBody(textPart);
            } else if (emailData.payload.body && emailData.payload.body.data) {
                if (emailData.payload.mimeType === 'text/html') {
                    htmlBody = getPartBody(emailData.payload);
                } else {
                    textBody = getPartBody(emailData.payload);
                }
            }

            const docId = `google-${accountEmail}-${emailData.id}`.replace(/[^a-zA-Z0-9]/g, '-');
            const emailDoc = {
                userId: userId,
                accountEmail: accountEmail,
                provider: 'google',
                from,
                subject,
                snippet: emailData.snippet || '',
                htmlBody,
                textBody,
                receivedAt: new Date(date),
                createdAt: new Date(),
                gmailId: emailData.id,
            };
            
            const docRef = emailsRef.doc(docId);
            batch.set(docRef, emailDoc, { merge: true });
            addedCount++;
        }

        if (addedCount > 0) {
            await batch.commit();
        }
        
        return { success: true, count: addedCount };
    } catch (error: any) {
        console.error('Error syncing emails:', error);
        return { success: false, count: 0, message: error.message };
    }
}

/**
 * Sends an email via Google Gmail API.
 */
export async function sendGoogleEmail(userId: string, accountEmail: string, to: string, subject: string, body: string) {
    const { firestore } = getServerFirebase();
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        const emailKey = accountEmail.replace(/\./g, '_');
        const account = userDoc.data()?.integrations?.googleAccounts?.[emailKey];
        if (!account?.refreshToken) throw new Error('Account not connected or refresh token missing');

        const accessToken = await getNewAccessToken(account.refreshToken);
        
        // Gmail API requires the email to be base64url encoded RFC822 message
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            body,
        ];
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedMessage }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Gmail API error: ${JSON.stringify(error)}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending Google email:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Creates a calendar event via Google Calendar API.
 */
export async function createGoogleEvent(userId: string, accountEmail: string, eventData: { title: string, startTime: Date, endTime: Date, location?: string, description?: string }) {
    const { firestore } = getServerFirebase();
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        const emailKey = accountEmail.replace(/\./g, '_');
        const account = userDoc.data()?.integrations?.googleAccounts?.[emailKey];
        if (!account?.refreshToken) throw new Error('Account not connected');

        const accessToken = await getNewAccessToken(account.refreshToken);

        const googleEvent = {
            summary: eventData.title,
            description: eventData.description || '',
            location: eventData.location || '',
            start: { dateTime: eventData.startTime.toISOString() },
            end: { dateTime: eventData.endTime.toISOString() },
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
        }

        const result = await response.json();
        return { success: true, id: result.id };
    } catch (error: any) {
        console.error('Error creating Google event:', error);
        return { success: false, message: error.message };
    }
}
