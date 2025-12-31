
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEmails, type Email } from '@/contexts/email-context';
import { Skeleton } from './ui/skeleton';
import { Mail, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { EmailDetailView } from './email-detail-view';

export function EmailsPage() {
  const { emails, loading } = useEmails();
  const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);

  React.useEffect(() => {
    // Select the first email by default if the list is loaded
    if (!loading && emails.length > 0 && !selectedEmail) {
      setSelectedEmail(emails[0]);
    }
     // If the selected email is no longer in the list, deselect it
    if (selectedEmail && !emails.find(e => e.id === selectedEmail.id)) {
      setSelectedEmail(emails.length > 0 ? emails[0] : null);
    }
  }, [emails, loading, selectedEmail]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <Card className="md:col-span-1 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail /> Google Emails</CardTitle>
          <CardDescription>
            A list of your most recently synced emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-y-auto">
            <div className="border-t">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : emails.length > 0 ? (
                emails.map(email => (
                  <button
                    key={email.id}
                    className={cn(
                      "w-full text-left p-4 border-b hover:bg-muted/50 focus:bg-accent focus:outline-none transition-colors",
                      selectedEmail?.id === email.id && "bg-accent"
                    )}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <p className="font-semibold truncate">{email.from}</p>
                    <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {(email.receivedAt as Timestamp)?.toDate && formatDistanceToNow((email.receivedAt as Timestamp).toDate(), { addSuffix: true })}
                    </p>
                  </button>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <Inbox className="h-12 w-12 mb-4" />
                    <h3 className="font-semibold">No emails found</h3>
                    <p className="text-sm">Try syncing your Google account on the settings page.</p>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
      
      <div className="md:col-span-2 h-full">
         <EmailDetailView email={selectedEmail} isLoading={loading} />
      </div>

    </div>
  );
}
