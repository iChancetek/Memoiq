'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAppointmentAnalysis } from '@/ai/flows/get-appointment-analysis';
import { mockContacts, mockCalendarEvents } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AppointmentManagerPage() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const { toast } = useToast();

  const handleAnalyzeAppointments = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await getAppointmentAnalysis({
        contacts: JSON.stringify(mockContacts),
        calendarEvents: JSON.stringify(mockCalendarEvents),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
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
          <Button onClick={handleAnalyzeAppointments} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : 'Generate Appointment Analysis'}
          </Button>

          {analysis && (
            <div className="mt-6 space-y-4">
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
