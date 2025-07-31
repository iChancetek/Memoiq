'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Mail, Building, CalendarClock, Bot, Plus, Pencil } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useContacts } from '@/contexts/contact-context';
import { CreateContactForm } from './create-contact-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function ContactsPage() {
  const { contacts, loading } = useContacts();

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0];
    return names[0][0] + names[names.length - 1][0];
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <CardTitle>Create New Contact</CardTitle>
          </div>
          <CardDescription>
            Use the AI to parse details from text or voice, or enter details manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateContactForm />
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <Card key={i}>
                <CardHeader><Skeleton className="h-12 w-full" /></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
             </Card>
           ))
        ) : contacts.map(contact => (
          <Card key={contact.id}>
            <CardHeader className="flex flex-row items-center gap-4">
               <Avatar className="h-12 w-12">
                 <AvatarImage src={`https://placehold.co/100x100.png?text=${encodeURIComponent(contact.name)}`} />
                 <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
               </Avatar>
               <div>
                <CardTitle>{contact.name}</CardTitle>
                <CardDescription>{contact.title}</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
               <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{contact.company || 'N/A'}</span>
               </div>
               <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
               </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    <span>Last contacted: {contact.lastContact}</span>
               </div>
               {contact.notes && (
                 <p className="text-xs text-muted-foreground italic p-2 rounded-md bg-muted/50 w-full">
                    Note: {contact.notes}
                 </p>
               )}
            </CardContent>
          </Card>
        ))}
      </div>
       {!loading && contacts.length === 0 && (
            <div className="py-24 text-center text-muted-foreground col-span-full">
                <User className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No contacts yet</h3>
                <p>Use the form above to add your first one.</p>
            </div>
        )}
    </div>
  );
}
