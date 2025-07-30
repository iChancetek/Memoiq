'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, User, Mail, Building, CalendarClock, Bot, Plus } from 'lucide-react';
import { getContactInsights } from '@/ai/flows/get-contact-insights';
import { type Contact } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { useContacts } from '@/contexts/contact-context';
import { CreateContactDialog } from './create-contact-dialog';

export function ContactsPage() {
  const { contacts, loading } = useContacts();
  const [loadingInsights, setLoadingInsights] = React.useState(false);
  const [insights, setInsights] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    setInsights(null);
    try {
      const response = await getContactInsights({
        contacts: JSON.stringify(contacts),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setInsights(response.followUpSuggestions);
    } catch (error) {
      console.error('Error getting contact insights:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate contact insights.',
      });
    } finally {
      setLoadingInsights(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <div className="space-y-6">
       <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <CardTitle>Relationship Intelligence</CardTitle>
              </div>
              <CardDescription>
                Click the button to get AI-powered suggestions for who to follow up with.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGetInsights} disabled={loadingInsights || contacts.length === 0} className="w-full">
                {loadingInsights ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {loadingInsights ? 'Analyzing...' : 'Generate Follow-up Suggestions'}
              </Button>
              {insights && (
                <Alert className="mt-4">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>AI Suggestions</AlertTitle>
                    <AlertDescription>
                      <p className="whitespace-pre-wrap">{insights}</p>
                    </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        <CreateContactDialog>
            <Button className="gap-2">
                <Plus /> Create Contact
            </Button>
        </CreateContactDialog>
       </div>


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
                 <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(contact.name)}`} />
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
                    <span>{contact.company}</span>
               </div>
               <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
               </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    <span>Last contacted: {contact.lastContact}</span>
               </div>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground italic p-2 rounded-md bg-muted/50 w-full">
                  Note: {contact.notes}
                </p>
            </CardFooter>
          </Card>
        ))}
      </div>
       {!loading && contacts.length === 0 && (
            <div className="py-24 text-center text-muted-foreground col-span-full">
                <User className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No contacts yet</h3>
                <p>Click "Create Contact" to add your first one.</p>
            </div>
        )}
    </div>
  );
}
