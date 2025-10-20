'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle, ShieldAlert, Play, Pause, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAppointmentAnalysis } from '@/ai/flows/get-appointment-analysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useContacts } from '@/contexts/contact-context';
import { useCalendar } from '@/contexts/calendar-context';

export function AppointmentManagerPage() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { toast } = useToast();
  const { contacts, loading: contactsLoading } = useContacts();
  const { events, loading: eventsLoading } = useCalendar();

  const isDataLoading = contactsLoading || eventsLoading;
  const hasData = contacts.length > 0 || events.length > 0;

  const handleAnalyzeAppointments = async () => {
    setLoading(true);
    setAnalysis(null);
    if (audio) {
      audio.pause();
      setAudio(null);
      setIsPlaying(false);
    }
    try {
      const response = await getAppointmentAnalysis({
        contacts: JSON.stringify(contacts),
        calendarEvents: JSON.stringify(events),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
      if (response.audioDataUri) {
          const newAudio = new Audio(response.audioDataUri);
          setAudio(newAudio);
          newAudio.play().catch(console.error);
          setIsPlaying(true);
          newAudio.onended = () => setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error analyzing appointments:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Failed to connect to the appointment analysis AI.',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Appointment Manager</CardTitle>
          <CardDescription>
            Get a high-level analysis of your upcoming appointments, including potential risks and proactive suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyzeAppointments} disabled={loading || isDataLoading || !hasData} className="w-full">
            {loading || isDataLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : isDataLoading ? 'Loading Data...' : 'Generate Appointment Analysis'}
          </Button>

          {!isDataLoading && !hasData && (
              <Alert className="mt-4">
                  <CalendarDays className="h-4 w-4" />
                  <AlertTitle>No Data to Analyze</AlertTitle>
                  <AlertDescription>
                      There are no contacts or events to analyze. Please add some first.
                      <div className="mt-2">
                        <Button variant="link" asChild><Link href="/contacts">Go to Contacts</Link></Button>
                        <Button variant="link" asChild><Link href="/calendar">Go to Calendar</Link></Button>
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
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Weekly Appointment Outlook</AlertTitle>
                <AlertDescription>
                  {analysis.summary}
                </AlertDescription>
              </Alert>
              
              {analysis.schedulingRisks.length > 0 && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Potential Scheduling Risks</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                          {analysis.schedulingRisks.map((risk: string, index: number) => (
                              <li key={index}>{risk}</li>
                          ))}
                      </ul>
                  </AlertDescription>
                </Alert>
              )}

               <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" /> Proactive Suggestions
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        {analysis.proactiveSuggestions.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                 </CardContent>
               </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
