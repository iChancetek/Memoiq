'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEmails } from '@/contexts/email-context';
import { Skeleton } from './ui/skeleton';
import { Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function EmailsPage() {
  const { emails, loading } = useEmails();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synced Emails</CardTitle>
        <CardDescription>
          A list of your most recently synced emails from Google.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">From</TableHead>
                <TableHead>Subject & Snippet</TableHead>
                <TableHead className="w-[150px] text-right">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-5/6 mt-1" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : emails.length > 0 ? (
                emails.map(email => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium truncate">{email.from}</TableCell>
                    <TableCell>
                      <p className="font-semibold truncate">{email.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{email.snippet}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(email.receivedAt.toDate(), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No emails found. Try syncing your Google account on the settings page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
