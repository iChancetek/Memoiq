'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarPlus, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scheduleAppointment } from '@/ai/flows/schedule-appointment';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTasks } from '@/contexts/task-context';
import { useContacts } from '@/contexts/contact-context';

export function AppointmentsPage() {
  const [request, setRequest] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const { toast } = useToast();
  const { tasks } = useTasks();
  const { contacts } = useContacts();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await scheduleAppointment({
        request,
        calendarEvents: JSON.stringify([]), // To be replaced with live data
        tasks: JSON.stringify(tasks),
        contacts: JSON.stringify(contacts),
      });
      setResult(response);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Scheduling Error',
        description: 'Failed to connect to the scheduling AI.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirm = () => {
     // In a real app, this would update the state, call an API, etc.
     toast({
        title: "Appointment Confirmed!",
        description: `"${result.title}" scheduled for ${result.suggestedDate} at ${result.suggestedTime}.`,
     });
     setResult(null);
     setRequest('');
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-6 w-6 text-primary" />
            <CardTitle>Schedule an Appointment</CardTitle>
          </div>
          <CardDescription>
            Use natural language to schedule. For example: "Lunch with Sam next Friday at 1pm"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSchedule} className="flex gap-2">
            <Input
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Your request..."
              className="flex-grow"
              disabled={loading}
            />
            <Button type="submit" size="icon" aria-label="Schedule" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            </Button>
          </form>
        </CardContent>

        {result && (
            <CardFooter>
                 <Alert variant={result.isPossible ? 'default' : 'destructive'} className="w-full">
                    {result.isPossible ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>
                        {result.isPossible ? `Suggested Time: ${result.title}` : 'Scheduling Conflict'}
                    </AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">{result.reasoning}</p>
                        {result.isPossible && (
                            <p className="font-semibold">{result.suggestedDate} at {result.suggestedTime}</p>
                        )}
                    </AlertDescription>
                    {result.isPossible && (
                        <div className="mt-4 flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setResult(null)}>Cancel</Button>
                            <Button size="sm" onClick={handleConfirm}>Confirm</Button>
                        </div>
                    )}
                </Alert>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
