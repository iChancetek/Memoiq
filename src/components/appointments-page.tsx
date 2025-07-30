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
import { CalendarPlus, CheckCircle, XCircle, Sparkles, Loader2, Mic, StopCircle, Bot, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scheduleAppointment } from '@/ai/flows/schedule-appointment';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTasks } from '@/contexts/task-context';
import { useContacts } from '@/contexts/contact-context';
import { useCalendar } from '@/contexts/calendar-context';
import { format, parse } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ManualAppointmentForm } from './manual-appointment-form';

type RecordingState = 'idle' | 'recording' | 'processing';

export function AppointmentsPage() {
  const [request, setRequest] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const { toast } = useToast();
  const { tasks } = useTasks();
  const { contacts } = useContacts();
  const { events, addEvent } = useCalendar();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
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
  
  const handleConfirm = async () => {
    if (!result) return;
    
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
            // For simplicity, let's assume a 1-hour duration
            endTime: new Date(parsedDate.getTime() + 60 * 60 * 1000),
            location: '',
        });

        toast({
            title: "Appointment Confirmed!",
            description: `"${result.title}" scheduled for ${result.suggestedDate} at ${result.suggestedTime}.`,
        });
        setResult(null);
        setRequest('');
    } catch (error) {
        console.error("Error confirming appointment: ", error);
        toast({
            variant: 'destructive',
            title: 'Confirmation Error',
            description: 'Could not save the appointment. Please try creating it from the calendar directly.',
        });
    }
  }
  
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      mediaRecorderRef.current = new MediaRecorder(stream);
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
            const result = await transcribeAudio({ audioDataUri: base64Audio });
            setRequest(result.transcription);
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

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-6 w-6 text-primary" />
            <CardTitle>Schedule an Appointment</CardTitle>
          </div>
          <CardDescription>
            Use the AI to schedule with natural language, or enter details manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ai" className="gap-2"><Bot /> AI Scheduling</TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2"><Pencil /> Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="pt-4">
                     <form onSubmit={handleSchedule} className="flex gap-2">
                        <Input
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        placeholder="e.g. 'Lunch with Sam next Friday at 1pm'"
                        className="flex-grow"
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

                        <Button type="submit" size="icon" aria-label="Schedule" disabled={loading || isRecording || isProcessing || !request.trim()}>
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        </Button>
                    </form>
                     {result && (
                        <div className="mt-4">
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
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="manual">
                    <ManualAppointmentForm />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
