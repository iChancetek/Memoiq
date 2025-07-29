'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function CalendarPage() {
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Integrated Calendar</CardTitle>
          <CardDescription>This page is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The unified and predictive calendar view is coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
