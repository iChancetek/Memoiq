'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getContactInsights } from '@/ai/flows/get-contact-insights';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useContacts } from '@/contexts/contact-context';

export default function ContactManagerRoute() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const { toast } = useToast();
  const { contacts, loading: contactsLoading } = useContacts();

  const handleAnalyzeContacts = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await getContactInsights({
        contacts: JSON.stringify(contacts),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
    } catch (error) {
      console.error('Error analyzing contacts:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Failed to connect to the contact analysis AI.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Contacts Manager</CardTitle>
          <CardDescription>
            Get a high-level analysis of your contacts and identify key follow-up opportunities to maintain relationships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyzeContacts} disabled={loading || contactsLoading || contacts.length === 0} className="w-full">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : 'Generate Contact Suggestions'}
          </Button>

          {analysis && (
            <div className="mt-6 space-y-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Recommended Follow-ups</AlertTitle>
                <AlertDescription>
                   <p className="whitespace-pre-wrap">{analysis.followUpSuggestions}</p>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
