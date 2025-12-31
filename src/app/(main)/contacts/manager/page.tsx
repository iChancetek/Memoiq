'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Users, UserPlus, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getContactInsights } from '@/ai/flows/get-contact-insights';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useContacts } from '@/contexts/contact-context';

export default function ContactManagerRoute() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { contacts, loading: contactsLoading } = useContacts();
  
  const hasData = contacts.length > 0;
  const isDataLoading = contactsLoading;

  const handleAnalyzeContacts = async () => {
    setLoading(true);
    setAnalysis(null);
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    try {
      const response = await getContactInsights({
        contacts: JSON.stringify(contacts),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
      if (response.audioDataUri) {
          audioRef.current = new Audio(response.audioDataUri);
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
          audioRef.current.onended = () => setIsPlaying(false);
      }
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

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
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
          <Button onClick={handleAnalyzeContacts} disabled={loading || isDataLoading || !hasData} className="w-full">
            {loading || isDataLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : (isDataLoading ? 'Loading Contacts...' : 'Generate Contact Suggestions')}
          </Button>

          {!isDataLoading && !hasData && (
             <Alert className="mt-4">
                  <UserPlus className="h-4 w-4" />
                  <AlertTitle>No Contacts to Analyze</AlertTitle>
                  <AlertDescription>
                      There are no contacts in your list. Please add a contact first to get suggestions.
                      <div className="mt-2">
                        <Button variant="link" asChild><Link href="/contacts">Go to Contacts</Link></Button>
                      </div>
                  </AlertDescription>
              </Alert>
          )}

          {analysis && (
            <div className="mt-6 space-y-4">
               <div className="flex justify-end">
                <Button onClick={togglePlayback} disabled={!analysis.audioDataUri || loading}>
                  {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                  {isPlaying ? 'Pause' : 'Play Analysis'}
                </Button>
              </div>
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
