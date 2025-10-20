
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Sparkles, Loader2, Save, StopCircle, CheckCircle, XCircle, CalendarPlus, Bot, Pencil } from 'lucide-react';
import { useCalendar } from '@/contexts/calendar-context';
import { useTasks } from '@/contexts/task-context';
import { useContacts } from '@/contexts/contact-context';
import { useToast } from '@/hooks/use-toast';
import { scheduleAppointment } from '@/ai/flows/schedule-appointment';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { parse } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ManualEventForm } from './manual-event-form';
import { useAuth } from '@/contexts/auth-context';

type RecordingState = 'idle' | 'recording' | 'processing';

function AIScheduler() {
  const [request, setRequest] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const { user } = useAuth();
  const { addEvent, events } = useCalendar();
  const { tasks } = useTasks();
  const { contacts } = useContacts();
  const { toast } = useToast();
  // @ts-ignore
  const lang = user?.settings?.language || 'en';
  
  const handleSchedule = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!request.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await scheduleAppointment({
        request,
        calendarEvents: JSON.stringify(events),
        tasks: JSON.stringify(tasks),
        contacts: JSON.stringify(contacts),
      });
      setResult(response);
    } catch (error) {
      console.error('Error scheduling event:', error);
      toast({
        variant: 'destructive',
        title: 'Scheduling Error',
        description: 'Failed to connect to the scheduling AI.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || !result.isPossible) return;
    
    setLoading(true);
    try {
        const dateTimeString = `${result.suggestedDate} ${result.suggestedTime}`;
        const formatString = 'yyyy-MM-dd h:mm a';
        const parsedDate = parse(dateTimeString, formatString, new Date());

        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date format from AI');
        }

        await addEvent({
            title: result.title,
            startTime: parsedDate,
            endTime: new Date(parsedDate.getTime() + 60 * 60 * 1000), // Default 1 hour duration
            location: '', // Location parsing can be added later
        });

        toast({
            title: "Event Scheduled!",
            description: `"${result.title}" is now on your calendar.`,
        });
        setRequest('');
        setResult(null);
    } catch (error) {
        console.error("Error confirming event: ", error);
        toast({
            variant: 'destructive',
            title: 'Confirmation Error',
            description: 'Could not save the event. Please try again.',
        });
    } finally {
        setLoading(false);
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        setRecordingState('processing');
        const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const transcriptionResult = await transcribeAudio({ audioDataUri: base64Audio, language: lang });
            setRequest(transcriptionResult.transcription);
          } catch (error) {
            console.error('Transcription failed:', error);
            toast({
              variant: 'destructive',
              title: 'Processing Error',
              description: 'Failed to process the audio.',
            });
          } finally {
            setRecordingState('idle');
          }
        };
      };
      mediaRecorderRef.current.start();
      setRecordingState('recording');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: 'Could not start recording. Please check microphone permissions.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  if (result) {
    return (
        <div className="space-y-4">
            <Alert variant={result.isPossible ? 'default' : 'destructive'}>
                {result.isPossible ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>
                    {result.isPossible ? `Suggested: ${result.title}` : 'Scheduling Conflict'}
                </AlertTitle>
                <AlertDescription>
                    <p>{result.reasoning}</p>
                    {result.isPossible && (
                        <p className="font-semibold mt-2">{result.suggestedDate} at {result.suggestedTime}</p>
                    )}
                </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResult(null)}>Back</Button>
                {result.isPossible && (
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Confirm & Save
                    </Button>
                )}
            </div>
        </div>
    );
  }
  
  return (
    <form onSubmit={handleSchedule} className="flex items-center gap-2">
        <Input
        id="request"
        placeholder="e.g. 'Dentist appointment tomorrow at 3pm'"
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        disabled={loading || isRecording || isProcessing}
        />
        {isRecording ? (
            <Button type="button" size="icon" variant="destructive" onClick={handleStopRecording} aria-label="Stop recording">
                <StopCircle />
            </Button>
        ) : (
            <Button type="button" size="icon" onClick={handleStartRecording} aria-label="Start recording" disabled={loading || isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : <Mic />}
            </Button>
        )}
        <Button type="submit" size="icon" aria-label="Schedule with AI" disabled={loading || !request.trim() || isRecording || isProcessing}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        </Button>
    </form>
  )
}

export function CreateEventDialog() {
  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <CalendarPlus className="h-6 w-6 text-primary" />
                <CardTitle>Create Event</CardTitle>
            </div>
            <CardDescription>
                Use AI to schedule with natural language, or enter details manually.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ai" className="gap-2"><Bot /> AI Scheduling</TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2"><Pencil /> Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="pt-4">
                    <AIScheduler />
                </TabsContent>
                <TabsContent value="manual">
                    <ManualEventForm />
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
