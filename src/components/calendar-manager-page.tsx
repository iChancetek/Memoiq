'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCalendarAnalysis } from '@/ai/flows/get-calendar-analysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTasks } from '@/contexts/task-context';
import { useCalendar } from '@/contexts/calendar-context';
import Link from 'next/link';

export function CalendarManagerPage() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const { toast } = useToast();
  const { tasks, loading: tasksLoading } = useTasks();
  const { events, loading: eventsLoading } = useCalendar();

  const handleAnalyzeCalendar = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await getCalendarAnalysis({
        tasks: JSON.stringify(tasks),
        calendarEvents: JSON.stringify(events),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
    } catch (error) {
      console.error('Error analyzing calendar:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Failed to connect to the calendar analysis AI.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const hasData = tasks.length > 0 || events.length > 0;
  const isDataLoading = tasksLoading || eventsLoading;

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Calendar Manager</CardTitle>
          <CardDescription>
            Get a high-level analysis of your schedule, including busy periods and strategic recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyzeCalendar} disabled={loading || isDataLoading || !hasData} className="w-full">
            {loading || isDataLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : (isDataLoading ? 'Loading Data...' : 'Generate Calendar Analysis')}
          </Button>

          {!isDataLoading && !hasData && (
              <Alert className="mt-4">
                  <CalendarDays className="h-4 w-4" />
                  <AlertTitle>No Data to Analyze</AlertTitle>
                  <AlertDescription>
                      There are no tasks or calendar events to analyze. Please add some tasks or events first.
                      <div className="mt-2">
                        <Button variant="link" asChild><Link href="/tasks">Go to Tasks</Link></Button>
                        <Button variant="link" asChild><Link href="/calendar">Go to Calendar</Link></Button>
                      </div>
                  </AlertDescription>
              </Alert>
          )}

          {analysis && (
            <div className="mt-6 space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Weekly Outlook</AlertTitle>
                <AlertDescription>
                  {analysis.summary}
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Busiest Periods</AlertTitle>
                <AlertDescription>
                   <ul className="list-disc pl-5 space-y-1">
                        {analysis.busyPeriods.map((period: string, index: number) => (
                            <li key={index}>{period}</li>
                        ))}
                    </ul>
                </AlertDescription>
              </Alert>

               <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" /> Suggestions for Optimization
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        {analysis.suggestions.map((suggestion: string, index: number) => (
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
