
import { collection, doc, writeBatch, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore: db } = initializeFirebase();

/**
 * Helper to fetch from Microsoft Graph API
 */
async function fetchGraph(endpoint: string, accessToken: string, options: RequestInit = {}) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Graph API error: ${response.statusText}`);
  }

  return response.status === 204 ? null : response.json();
}

/**
 * Sync Microsoft Outlook Emails
 */
export async function syncMicrosoftEmails(userId: string, accessToken: string) {
  try {
    const data = await fetchGraph('/me/messages?$top=50&$orderby=receivedDateTime desc', accessToken);
    const messages = data.value || [];

    const batch = writeBatch(db);
    const emailsRef = collection(db, 'users', userId, 'emails');

    // For simplicity in this initial sync, we'll clear old ones or just upsert
    // In a real scenario, use delta queries
    for (const msg of messages) {
      const emailDoc = doc(emailsRef, `ms-${msg.id}`);
      batch.set(emailDoc, {
        provider: 'microsoft',
        externalId: msg.id,
        subject: msg.subject,
        from: msg.from?.emailAddress?.address || msg.from?.emailAddress?.name || 'Unknown',
        to: msg.toRecipients?.map((r: any) => r.emailAddress.address).join(', ') || '',
        textBody: msg.bodyPreview,
        htmlBody: msg.body?.content,
        receivedAt: new Date(msg.receivedDateTime),
        isRead: msg.isRead,
        syncedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true, count: messages.length };
  } catch (error: any) {
    console.error('Error syncing MS emails:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send Email via Microsoft Graph
 */
export async function sendMicrosoftEmail(accessToken: string, to: string, subject: string, body: string) {
  try {
    const emailData = {
      message: {
        subject: subject,
        body: {
          contentType: 'Text',
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
export async function syncMicrosoftCalendar(userId: string, accessToken: string) {
  try {
    const data = await fetchGraph('/me/events?$top=100&$orderby=start/dateTime asc', accessToken);
    const events = data.value || [];

    const batch = writeBatch(db);
    const eventsRef = collection(db, 'users', userId, 'events');

    for (const event of events) {
      const eventDoc = doc(eventsRef, `ms-${event.id}`);
      batch.set(eventDoc, {
        provider: 'microsoft',
        externalId: event.id,
        title: event.subject,
        description: event.bodyPreview,
        startTime: new Date(event.start.dateTime + (event.start.timeZone === 'UTC' ? 'Z' : '')),
        endTime: new Date(event.end.dateTime + (event.end.timeZone === 'UTC' ? 'Z' : '')),
        location: event.location?.displayName || '',
        isAllDay: event.isAllDay,
        syncedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true, count: events.length };
  } catch (error: any) {
    console.error('Error syncing MS calendar:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Create Microsoft Calendar Event
 */
export async function createMicrosoftEvent(accessToken: string, eventData: { title: string, startTime: Date, endTime: Date, location?: string, description?: string }) {
    try {
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

        const result = await fetchGraph('/me/events', accessToken, {
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
export async function syncMicrosoftContacts(userId: string, accessToken: string) {
  try {
    const data = await fetchGraph('/me/contacts?$top=100', accessToken);
    const contacts = data.value || [];

    const batch = writeBatch(db);
    const contactsRef = collection(db, 'users', userId, 'contacts');

    for (const contact of contacts) {
      const contactDoc = doc(contactsRef, `ms-${contact.id}`);
      batch.set(contactDoc, {
        provider: 'microsoft',
        externalId: contact.id,
        displayName: contact.displayName,
        email: contact.emailAddresses?.[0]?.address || '',
        phoneNumber: contact.businessPhones?.[0] || contact.mobilePhone || '',
        jobTitle: contact.jobTitle || '',
        company: contact.companyName || '',
        syncedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true, count: contacts.length };
  } catch (error: any) {
    console.error('Error syncing MS contacts:', error);
    return { success: false, message: error.message };
  }
}
