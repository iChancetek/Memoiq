import { getServerFirebase } from '@/firebase/server';
import { getNewAccessToken } from './microsoft-oauth';

/**
 * Helper to fetch from Microsoft Graph API
 */
async function fetchGraph(endpoint: string, accessToken: string, options: any = {}) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Graph API error: ${response.status}`);
    }

    return response.status === 204 ? null : response.json();
}

/**
 * Main entry point to sync a specific Microsoft account.
 */
export async function syncMicrosoftAccount(userId: string, accountEmail: string) {
    const { firestore } = getServerFirebase();
    
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) throw new Error('User not found');
        
        const userData = userDoc.data();
        const emailKey = accountEmail.replace(/\./g, '_');
        const account = userData?.integrations?.microsoftAccounts?.[emailKey];
        
        if (!account || !account.refreshToken) {
            throw new Error(`No refresh token found for account: ${accountEmail}`);
        }
        
        // 1. Get a fresh access token
        const accessToken = await getNewAccessToken(account.refreshToken);
        
        // 2. Run syncs
        const contactsResult = await syncMicrosoftContacts(userId, accountEmail, accessToken);
        const calendarResult = await syncMicrosoftCalendar(userId, accountEmail, accessToken);
        const emailsResult = await syncMicrosoftEmails(userId, accountEmail, accessToken);
        
        // 3. Update last sync time
        await firestore.collection('users').doc(userId).update({
            [`integrations.microsoftAccounts.${emailKey}.lastSync`]: new Date()
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
        console.error(`Error syncing M365 account ${accountEmail}:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Sync Microsoft Outlook Emails
 */
export async function syncMicrosoftEmails(userId: string, accountEmail: string, accessToken: string) {
    const { firestore: db } = getServerFirebase();
    try {
        const data: any = await fetchGraph('/me/messages?$top=50&$orderby=receivedDateTime desc', accessToken);
        const messages = data.value || [];

        const batch = db.batch();
        const emailsRef = db.collection('users').doc(userId).collection('emails');

        for (const msg of messages) {
            const docId = `ms-${accountEmail}-${msg.id}`.replace(/[^a-zA-Z0-9]/g, '-');
            const emailDoc = emailsRef.doc(docId);
            batch.set(emailDoc, {
                userId: userId,
                accountEmail: accountEmail,
                provider: 'microsoft',
                externalId: msg.id,
                subject: msg.subject,
                from: msg.from?.emailAddress?.address || msg.from?.emailAddress?.name || 'Unknown',
                to: msg.toRecipients?.map((r: any) => r.emailAddress.address).join(', ') || '',
                snippet: msg.bodyPreview || '',
                textBody: msg.bodyPreview,
                htmlBody: msg.body?.content,
                receivedAt: new Date(msg.receivedDateTime),
                isRead: msg.isRead,
                createdAt: new Date(),
            }, { merge: true });
        }

        await batch.commit();
        return { success: true, count: messages.length };
    } catch (error: any) {
        console.error('Error syncing MS emails:', error);
        return { success: false, count: 0, message: error.message };
    }
}

/**
 * Send Email via Microsoft Graph
 */
export async function sendMicrosoftEmail(userId: string, accountEmail: string, to: string, subject: string, body: string) {
    const { firestore } = getServerFirebase();
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        const emailKey = accountEmail.replace(/\./g, '_');
        const account = userDoc.data()?.integrations?.microsoftAccounts?.[emailKey];
        if (!account?.refreshToken) throw new Error('Account not connected');

        const accessToken = await getNewAccessToken(account.refreshToken);

        const emailData = {
            message: {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: body,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to,
                        },
                    },
                ],
            },
            saveToSentItems: 'true',
        };

        await fetchGraph('/me/sendMail', accessToken, {
            method: 'POST',
            body: JSON.stringify(emailData),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error sending MS email:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Sync Microsoft Calendar Events
 */
export async function syncMicrosoftCalendar(userId: string, accountEmail: string, accessToken: string) {
    const { firestore: db } = getServerFirebase();
    try {
        const data: any = await fetchGraph('/me/events?$top=100&$orderby=start/dateTime asc', accessToken);
        const events = data.value || [];

        const batch = db.batch();
        const eventsRef = db.collection('users').doc(userId).collection('events');

        for (const event of events) {
            const docId = `ms-${accountEmail}-${event.id}`.replace(/[^a-zA-Z0-9]/g, '-');
            const eventDoc = eventsRef.doc(docId);
            batch.set(eventDoc, {
                userId: userId,
                accountEmail: accountEmail,
                provider: 'microsoft',
                externalId: event.id,
                title: event.subject,
                description: event.bodyPreview,
                startTime: new Date(event.start.dateTime + (event.start.timeZone === 'UTC' ? 'Z' : '')),
                endTime: new Date(event.end.dateTime + (event.end.timeZone === 'UTC' ? 'Z' : '')),
                location: event.location?.displayName || '',
                isAllDay: event.isAllDay,
                createdAt: new Date(),
            }, { merge: true });
        }

        await batch.commit();
        return { success: true, count: events.length };
    } catch (error: any) {
        console.error('Error syncing MS calendar:', error);
        return { success: false, count: 0, message: error.message };
    }
}

/**
 * Create Microsoft Calendar Event
 */
export async function createMicrosoftEvent(userId: string, accountEmail: string, eventData: { title: string, startTime: Date, endTime: Date, location?: string, description?: string }) {
    const { firestore } = getServerFirebase();
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        const emailKey = accountEmail.replace(/\./g, '_');
        const account = userDoc.data()?.integrations?.microsoftAccounts?.[emailKey];
        if (!account?.refreshToken) throw new Error('Account not connected');

        const accessToken = await getNewAccessToken(account.refreshToken);

        const msEvent = {
            subject: eventData.title,
            body: {
                contentType: 'HTML',
                content: eventData.description || '',
            },
            start: {
                dateTime: eventData.startTime.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: eventData.endTime.toISOString(),
                timeZone: 'UTC',
            },
            location: {
                displayName: eventData.location || '',
            },
        };

        const result: any = await fetchGraph('/me/events', accessToken, {
            method: 'POST',
            body: JSON.stringify(msEvent),
        });

        return { success: true, id: result.id };
    } catch (error: any) {
        console.error('Error creating MS event:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Sync Microsoft Contacts
 */
export async function syncMicrosoftContacts(userId: string, accountEmail: string, accessToken: string) {
    const { firestore: db } = getServerFirebase();
    try {
        const data: any = await fetchGraph('/me/contacts?$top=100', accessToken);
        const contacts = data.value || [];

        const batch = db.batch();
        const contactsRef = db.collection('users').doc(userId).collection('contacts');

        for (const contact of contacts) {
            const email = contact.emailAddresses?.[0]?.address || '';
            const docId = `ms-${accountEmail}-${contact.id}`.replace(/[^a-zA-Z0-9]/g, '-');
            const contactDoc = contactsRef.doc(docId);
            batch.set(contactDoc, {
                userId: userId,
                accountEmail: accountEmail,
                provider: 'microsoft',
                externalId: contact.id,
                name: contact.displayName,
                email: email,
                phoneNumber: contact.businessPhones?.[0] || contact.mobilePhone || '',
                title: contact.jobTitle || '',
                company: contact.companyName || '',
                createdAt: new Date(),
            }, { merge: true });
        }

        await batch.commit();
        return { success: true, count: contacts.length };
    } catch (error: any) {
        console.error('Error syncing MS contacts:', error);
        return { success: false, count: 0, message: error.message };
    }
}
