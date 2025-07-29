'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, User, Mail, Building, CalendarClock, Bot } from 'lucide-react';
import { getContactInsights } from '@/ai/flows/get-contact-insights';
import { mockContacts, type Contact } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>(mockContacts);
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
           <Button onClick={handleGetInsights} disabled={loadingInsights} className="w-full">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {contacts.map(contact => (
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
    </div>
  );
}
