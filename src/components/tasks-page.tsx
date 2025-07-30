
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {PlusCircle, Sparkles, Loader2, ListPlus, User, Mic, StopCircle} from 'lucide-react';
import { type Task, type Contact } from '@/lib/data';
import {useToast} from '@/hooks/use-toast';
import {parseTaskString} from '@/ai/flows/parse-task-string';
import {transcribeAudio} from '@/ai/flows/transcribe-audio';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTasks } from '@/contexts/task-context';
import { useContacts } from '@/contexts/contact-context';
import { Skeleton } from './ui/skeleton';

type RecordingState = 'idle' | 'recording' | 'processing';

export function TasksPage() {
  const { tasks, toggleTask, toggleSubtask, addTask, loading: tasksLoading } = useTasks();
  const { contacts, loading: contactsLoading } = useContacts();
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const {toast} = useToast();

  const contactsMap = React.useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach(contact => map.set(contact.id, contact));
    return map;
  }, [contacts]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setIsParsing(true);
    try {
      const result = await parseTaskString({
        taskString: newTaskTitle,
        contacts: JSON.stringify(contacts),
        context: `Existing tasks: ${JSON.stringify(tasks.map(t => t.title))}`
      });
      
      await addTask({
        title: result.title,
        dueDate: result.dueDate,
        subtasks: result.subtasks.map((sub, i) => ({ id: `${Date.now()}-${i}`, title: sub, completed: false })),
        contactIds: result.contactIds.map(String),
      });

      setNewTaskTitle('');
      toast({
        title: 'Task Added',
        description: `"${result.title}" has been added to your list.`,
      });
    } catch (error) {
       console.error("Failed to parse task:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Could not understand the task. Please try rephrasing.",
       });
    } finally {
        setIsParsing(false);
    }
  };

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
            setNewTaskTitle(result.transcription);
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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Tasks</CardTitle>
          <CardDescription>
            Add, view, and complete your to-do items. Mention contacts by name to link them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="e.g., 'Follow up with Olivia Chen about Project Phoenix'"
              className="flex-grow"
              disabled={isParsing || tasksLoading || isRecording || isProcessingAudio}
            />
             {isRecording ? (
                 <Button type="button" size="icon" variant="destructive" onClick={handleStopRecording} aria-label="Stop recording">
                    <StopCircle />
                 </Button>
            ) : (
                 <Button type="button" size="icon" onClick={handleStartRecording} aria-label="Start recording" disabled={isParsing || tasksLoading || isProcessingAudio}>
                    {isProcessingAudio ? <Loader2 className="animate-spin" /> : <Mic />}
                 </Button>
            )}
            <Button type="submit" size="icon" aria-label="Add task" disabled={isParsing || tasksLoading || isRecording || isProcessingAudio || !newTaskTitle.trim()}>
              {isParsing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px] text-center">Contacts</TableHead>
                  <TableHead className="w-[120px] text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-5 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : tasks.map(task => (
                  <React.Fragment key={task.id}>
                    <TableRow
                      className={task.completed ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          aria-label={`Mark task "${task.title}" as ${
                            task.completed ? 'incomplete' : 'complete'
                          }`}
                        />
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          task.completed ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        {task.title}
                      </TableCell>
                       <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {task.contactIds?.map(id => {
                            const contact = contactsMap.get(id);
                            if (!contact) return null;
                            return (
                               <Tooltip key={id}>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="gap-1.5 pl-1.5">
                                      <User className="h-3 w-3" />
                                      {contact.name.split(' ')[0]}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{contact.name}</p>
                                  <p className="text-sm text-muted-foreground">{contact.company}</p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {task.dueDate}
                      </TableCell>
                    </TableRow>
                    {task.subtasks && task.subtasks.length > 0 && (
                       <TableRow className={`bg-muted/20 ${task.completed ? 'opacity-60' : ''}`}>
                           <TableCell colSpan={4} className="py-2 pl-16 pr-4">
                              <div className="space-y-2">
                                  {task.subtasks.map(subtask => (
                                       <div key={subtask.id} className="flex items-center gap-3">
                                          <Checkbox
                                            checked={subtask.completed}
                                            onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                                            aria-label={`Mark subtask "${subtask.title}" as ${
                                              subtask.completed ? 'incomplete' : 'complete'
                                            }`}
                                          />
                                          <span className={`text-sm ${subtask.completed ? "text-muted-foreground line-through" : ""}`}>
                                              {subtask.title}
                                          </span>
                                      </div>
                                  ))}
                              </div>
                           </TableCell>
                       </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          {!tasksLoading && tasks.length === 0 && (
            <div className="mt-6 py-12 text-center text-muted-foreground">
              <ListPlus className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">You have no tasks</h3>
              <p className="mt-1 text-sm">Add one above to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
