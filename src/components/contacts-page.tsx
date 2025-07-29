'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Contact } from 'lucide-react';

export function ContactsPage() {
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <Contact className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Contacts Management</CardTitle>
          <CardDescription>This page is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
           The AI-enriched contacts module is coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
