'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  Bot,
  CalendarDays,
  ListTodo,
  Loader2,
  MessageSquare,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';
import {getDailyBriefing} from '@/ai/flows/get-daily-briefing';
import {getWelcomeGreeting} from '@/ai/flows/get-welcome-greeting';
import {useToast} from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const mockMemos = [
  { id: 1, title: "Project Phoenix Kick-off", summary: "Initial meeting notes, outlined key milestones and stakeholders." },
];
const mockCalendarEvents = [
    { id: 1, title: "Team Stand-up", time: "9:00 AM", location: "Virtual" },
];

function IskylarBriefingCard() {
  const [briefing, setBriefing] = React.useState({ text: '', audioUri: '' });
  const [loading, setLoading] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const {toast} = useToast();
  const { user } = useAuth();
  const { tasks } = useTasks();

  React.useEffect(() => {
    if (user) {
        handleGetBriefing();
    }
  }, [user, tasks]);

  const handleGetBriefing = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const currentHour = new Date().getHours();
      const greetingPromise = getWelcomeGreeting({ 
          displayName: user.displayName?.split(' ')[0] || 'there',
          hour: currentHour
      });

      const briefingPromise = getDailyBriefing({
        displayName: user.displayName || 'User',
        memos: JSON.stringify(mockMemos.map(m => `${m.title}: ${m.summary}`)),
        tasks: JSON.stringify(tasks.map(t => `${t.title} (Due: ${t.dueDate})`)),
        calendarEvents: JSON.stringify(mockCalendarEvents.map(e => `${e.title} at ${e.time}`)),
      });

      const [greeting, dailyBriefing] = await Promise.all([greetingPromise, briefingPromise]);
      
      const combinedText = `${greeting.text} ${dailyBriefing.briefingText}`;
      
      // For simplicity, we'll use the briefing audio. A more advanced version could combine them.
      setBriefing({ text: combinedText, audioUri: dailyBriefing.briefingAudioDataUri });

    } catch (error) {
      console.error('Error getting briefing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get insights from iSkylar.',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) {
        if (briefing.audioUri) {
            audioRef.current = new Audio(briefing.audioUri);
            audioRef.current.onended = () => setIsPlaying(false);
        }
    }

    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio playback error", e));
        }
        setIsPlaying(!isPlaying);
    }
  }
  
  // Cleanup audio on component unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle>iSkylar Assistant</CardTitle>
        </div>
        <CardDescription>
          Your personal AI assistant for insights and reminders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
            <>
                <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>Today's Briefing</AlertTitle>
                    <AlertDescription>
                        <p className="whitespace-pre-wrap">{briefing.text}</p>
                    </AlertDescription>
                </Alert>
                <div className="mt-4 flex gap-2">
                    <Button onClick={togglePlayback} disabled={!briefing.audioUri} className="flex-1">
                        {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                        {isPlaying ? 'Pause' : 'Play Briefing'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleGetBriefing}
                        disabled={loading}
                        aria-label="Regenerate Briefing"
                        >
                       {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    </Button>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { tasks, loading: tasksLoading } = useTasks();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <IskylarBriefingCard />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <CardTitle>Upcoming Events</CardTitle>
          </div>
          <CardDescription>Your schedule for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {mockCalendarEvents.map(event => (
              <li key={event.id} className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.time} - {event.location}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <CardTitle>Recent Memos</CardTitle>
          </div>
          <CardDescription>Your latest transcribed thoughts.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {mockMemos.slice(0, 3).map(memo => (
              <li key={memo.id} className="rounded-md border p-3">
                <p className="font-medium truncate">{memo.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {memo.summary}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" />
            <CardTitle>To-Do List</CardTitle>
          </div>
          <CardDescription>A quick look at your pending tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.slice(0, 4).map(task => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-md p-2 ${
                    task.completed ? 'opacity-50' : ''
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-sm border-2 ${
                      task.completed ? 'bg-primary border-primary' : 'border-primary/50'
                    }`}
                  />
                  <span
                    className={`flex-grow ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
