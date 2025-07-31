'use client';

import * as React from 'react';
import {Button} from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Plus, Sparkles, Loader2, Mic, StopCircle, Save, CheckCircle, XCircle } from 'lucide-react';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { parseTaskString } from '@/ai/flows/parse-task-string';
import { useContacts } from '@/contexts/contact-context';
import { parseContactString } from '@/ai/flows/parse-contact-string';
import { format, parse } from 'date-fns';
import { useCalendar } from '@/contexts/calendar-context';
import { scheduleAppointment } from '@/ai/flows/schedule-appointment';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { useAuth } from '@/contexts/auth-context';

type RecordingState = 'idle' | 'recording' | 'processing';

export function QuickAdd() {
  const { tasks, addTask, loading: tasksLoading } = useTasks();
  const { addContact, loading: contactsLoading } = useContacts();
  const { addEvent, events } = useCalendar();
  const { contacts } = useContacts();
  const [isParsing, setIsParsing] = React.useState(false);
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const [eventRequest, setEventRequest] = React.useState('');
  const [eventResult, setEventResult] = React.useState<any>(null);
  
  const { toast } = useToast();
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const { user } = useAuth();
  // @ts-ignore
  const lang = user?.settings?.language || 'en';

  const handleTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const taskString = formData.get('taskString') as string;
    
    if (taskString.trim()) {
      setIsParsing(true);
      try {
        const result = await parseTaskString({
          taskString: taskString,
          contacts: JSON.stringify(contacts), 
          context: `Existing tasks: ${JSON.stringify(tasks.map(t => t.title))}`
        });

        await addTask({
          title: result.title,
          dueDate: result.dueDate,
          subtasks: result.subtasks.map((sub, i) => ({ id: `${Date.now()}-${i}`, title: sub, completed: false })),
          contactIds: result.contactIds.map(String),
        });

        toast({
          title: "Task Added",
          description: `"${result.title}" has been added to your list.`,
        });
        
        closeRef.current?.click();
        (event.target as HTMLFormElement).reset();
      } catch (error) {
         console.error("Failed to parse task:", error);
         toast({
           variant: "destructive",
           title: "AI Error",
           description: "Could not understand the task. Please try rephrasing.",
         });
      } finally {
          setIsParsing(false);
      }
    }
  };
  
  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const contactString = formData.get('contactString') as string;
    
    if (contactString.trim()) {
      setIsParsing(true);
      try {
        const result = await parseContactString({ contactString });

        await addContact({
            ...result,
            lastContact: format(new Date(), 'yyyy-MM-dd'),
        });

        toast({
          title: "Contact Added",
          description: `"${result.name}" has been added to your contacts.`,
        });
        
        closeRef.current?.click();
        (event.target as HTMLFormElement).reset();
      } catch (error) {
         console.error("Failed to parse contact:", error);
         toast({
           variant: "destructive",
           title: "AI Error",
           description: "Could not understand the contact details. Please try rephrasing.",
         });
      } finally {
          setIsParsing(false);
      }
    }
  };

  const handleEventSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventRequest.trim()) return;

    setIsParsing(true);
    setEventResult(null);
    try {
      const response = await scheduleAppointment({
        request: eventRequest,
        calendarEvents: JSON.stringify(events),
        tasks: JSON.stringify(tasks),
        contacts: JSON.stringify(contacts),
      });
      setEventResult(response);
    } catch (error) {
      console.error('Error scheduling event:', error);
      toast({
        variant: 'destructive',
        title: 'Scheduling Error',
        description: 'Failed to connect to the scheduling AI.',
      });
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleEventConfirm = async () => {
    if (!eventResult || !eventResult.isPossible) return;
    
    try {
        const dateTimeString = `${eventResult.suggestedDate} ${eventResult.suggestedTime}`;
        const formatString = 'yyyy-MM-dd h:mm a';
        const parsedDate = parse(dateTimeString, formatString, new Date());

        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date format from AI');
        }

        await addEvent({
            title: eventResult.title,
            startTime: parsedDate,
            endTime: new Date(parsedDate.getTime() + 60 * 60 * 1000), // Default 1 hour duration
            location: '', // Location parsing can be added later
        });

        toast({
            title: "Event Scheduled!",
            description: `"${eventResult.title}" is now on your calendar.`,
        });
        
        closeRef.current?.click();
        setEventRequest('');
        setEventResult(null);
    } catch (error) {
        console.error("Error confirming event: ", error);
        toast({
            variant: 'destructive',
            title: 'Confirmation Error',
            description: 'Could not save the event. Please try again.',
        });
    }
  };

  const handleStartRecording = async (setter: (text: string) => void) => {
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
            const transcriptionResult = await transcribeAudio({ audioDataUri: base64Audio, language: lang });
            setter(transcriptionResult.transcription);
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
  const isProcessingAudio = recordingState === 'processing';

  return (
    <Sheet onOpenChange={(open) => { if (!open) { setEventResult(null); setEventRequest(''); }}}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add something new</SheetTitle>
          <SheetDescription>
            Quickly add a new task, contact, or event to your workspace.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="task" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="event">
              Event
            </TabsTrigger>
          </TabsList>
          <TabsContent value="task">
            <form onSubmit={handleTaskSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="taskString">Describe your task</Label>
                <Input
                  id="taskString"
                  name="taskString"
                  placeholder="e.g. Follow up with Acme Corp next Friday"
                  required
                  disabled={isParsing || tasksLoading}
                />
              </div>
              <Button type="submit" className="mt-4" disabled={isParsing || tasksLoading}>
                {isParsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {isParsing ? 'Parsing...' : 'Add Task with AI'}
              </Button>
            </form>
          </TabsContent>
           <TabsContent value="contact">
            <form onSubmit={handleContactSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="contactString">Describe your contact</Label>
                <Input
                  id="contactString"
                  name="contactString"
                  placeholder="e.g. Add Jane Doe, CEO of Innovate Inc..."
                  required
                  disabled={isParsing || contactsLoading}
                />
              </div>
              <Button type="submit" className="mt-4" disabled={isParsing || contactsLoading}>
                {isParsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {isParsing ? 'Parsing...' : 'Add Contact with AI'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="event">
             <div className="grid gap-4 py-4">
                {!eventResult ? (
                    <form onSubmit={handleEventSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="eventString">Describe your event</Label>
                           <div className="flex gap-2">
                                <Input
                                id="eventString"
                                name="eventString"
                                placeholder="e.g. 'Dentist appt tomorrow at 2pm'"
                                required
                                value={eventRequest}
                                onChange={(e) => setEventRequest(e.target.value)}
                                disabled={isParsing || isRecording || isProcessingAudio}
                                />
                                {isRecording ? (
                                    <Button type="button" size="icon" variant="destructive" onClick={handleStopRecording} aria-label="Stop recording">
                                        <StopCircle />
                                    </Button>
                                ) : (
                                    <Button type="button" size="icon" onClick={() => handleStartRecording(setEventRequest)} aria-label="Start recording" disabled={isParsing || isProcessingAudio}>
                                        {isProcessingAudio ? <Loader2 className="animate-spin" /> : <Mic />}
                                    </Button>
                                )}
                           </div>
                        </div>
                        <Button type="submit" className="mt-4" disabled={isParsing || isRecording || isProcessingAudio || !eventRequest.trim()}>
                            {isParsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                            {isParsing ? 'Scheduling...' : 'Schedule with AI'}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <Alert variant={eventResult.isPossible ? 'default' : 'destructive'}>
                            {eventResult.isPossible ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <AlertTitle>
                                {eventResult.isPossible ? `Suggested: ${eventResult.title}` : 'Scheduling Conflict'}
                            </AlertTitle>
                            <AlertDescription>
                                <p>{eventResult.reasoning}</p>
                                {eventResult.isPossible && (
                                    <p className="font-semibold mt-2">{eventResult.suggestedDate} at {eventResult.suggestedTime}</p>
                                )}
                            </AlertDescription>
                        </Alert>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEventResult(null)}>Back</Button>
                            {eventResult.isPossible && (
                                <Button onClick={handleEventConfirm} disabled={isParsing}>
                                    <Save className="mr-2 h-4 w-4" /> Confirm & Save
                                </Button>
                            )}
                        </div>
                    </div>
                )}
             </div>
          </TabsContent>
        </Tabs>
        <SheetClose ref={closeRef} className="hidden" />
      </SheetContent>
    </Sheet>
  );
}

    
