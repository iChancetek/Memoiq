
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
  Volume2,
  VolumeX,
} from 'lucide-react';
import {getDailyBriefing} from '@/ai/flows/get-daily-briefing';
import {getWelcomeGreetingText} from '@/ai/flows/get-welcome-greeting';
import {useToast} from '@/hooks/use-toast';
import { useTasks } from '@/contexts/task-context';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useCalendar } from '@/contexts/calendar-context';
import { useMemos } from '@/components/memos-page';
import { format, isToday, isFuture } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { useEmails } from '@/contexts/email-context';

function IskylarBriefingCard() {
  const [briefing, setBriefing] = React.useState({ text: '', audioUri: '' });
  const [loading, setLoading] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const {toast} = useToast();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { events } = useCalendar();
  const { memos } = useMemos();
  const { emails } = useEmails();
  const { t } = useLanguage();

  const enableVoiceGreeting = user?.settings?.enableVoiceGreeting !== false; // Default to true if not set


  const handleGetBriefing = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const currentHour = new Date().getHours();
      const lang = user.settings?.language || 'en';

      const greetingText = await getWelcomeGreetingText({
        displayName: user.displayName?.split(' ')[0] || 'there',
        hour: currentHour,
      });

      // Prepare a lightweight version of emails to avoid exceeding server action body limit
      const emailSummaries = emails.map(email => ({
        from: email.from,
        subject: email.subject
      }));
      
      const upcomingEvents = events.filter(e => isToday(e.startTime) || isFuture(e.startTime));

      const dailyBriefing = await getDailyBriefing({
        greeting: greetingText,
        displayName: user.displayName || 'User',
        memos: JSON.stringify(memos.map(m => `${m.title}: ${m.summary}`)),
        tasks: JSON.stringify(tasks.map(t => `${t.title} (Due: ${t.dueDate})`)),
        calendarEvents: JSON.stringify(upcomingEvents.map(e => `${e.title} at ${format(e.startTime, 'p')}`)),
        emails: JSON.stringify(emailSummaries),
        language: lang,
      });
      
      setBriefing({ text: dailyBriefing.briefingText, audioUri: dailyBriefing.briefingAudioDataUri });
    } catch (error) {
      console.error('Error getting briefing:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToGetInsights'),
      });
      setBriefing({ text: t('briefingConnectionError'), audioUri: '' });
    } finally {
      setLoading(false);
    }
  }, [user, tasks, events, memos, emails, toast, t]);

  React.useEffect(() => {
    if (user) {
      handleGetBriefing();
    }
  }, [user, handleGetBriefing]);

  React.useEffect(() => {
    if (briefing.audioUri) {
        audioRef.current = new Audio(briefing.audioUri);
        const audio = audioRef.current;
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handlePause);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handlePause);
            audio.pause();
            audioRef.current = null;
        }
    }
  }, [briefing.audioUri]);

  const togglePlayback = () => {
    if (audioRef.current) {
        if (audioRef.current.paused) {
            audioRef.current.play().catch(e => console.error("Audio playback error", e));
        } else {
            audioRef.current.pause();
        }
    }
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle>{t('iskylarAssistant')}</CardTitle>
        </div>
        <CardDescription>
          {t('personalAssistantDescription')}
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
                    <AlertTitle>{t('todaysBriefing')}</AlertTitle>
                    <AlertDescription>
                        <p className="whitespace-pre-wrap">{briefing.text}</p>
                    </AlertDescription>
                </Alert>
                <div className="mt-4 flex gap-2">
                    <Button onClick={togglePlayback} disabled={!briefing.audioUri || loading} className="flex-1">
                        {isPlaying ? <Pause className="mr-2" /> : (enableVoiceGreeting ? <Volume2 className="mr-2" /> : <VolumeX className="mr-2" />)}
                        {isPlaying ? t('pause') : t('playBriefing')}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleGetBriefing}
                        disabled={loading}
                        aria-label={t('regenerateBriefing')}
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

function RecentMemosCard() {
    const { memos, loading } = useMemos();
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader>
            <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <CardTitle>{t('recentMemos')}</CardTitle>
            </div>
            <CardDescription>{t('latestTranscribedThoughts')}</CardDescription>
            </CardHeader>
            <CardContent>
             {loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <ul className="space-y-3">
                    {memos.slice(0, 3).map(memo => (
                    <li key={memo.id} className="rounded-md border p-3">
                        <p className="font-medium truncate">{memo.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                        {memo.summary}
                        </p>
                    </li>
                    ))}
                </ul>
            )}
            </CardContent>
      </Card>
    )
}

export function DashboardPage() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { events, loading: eventsLoading } = useCalendar();
  const { t } = useLanguage();

  const upcomingEvents = events
    .filter(event => event.startTime >= new Date())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <IskylarBriefingCard />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <CardTitle>{t('upcomingEvents')}</CardTitle>
          </div>
          <CardDescription>{t('yourScheduleForToday')}</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <ul className="space-y-4">
                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <li key={event.id} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                        {format(event.startTime, 'p')} - {event.location}
                    </p>
                    </div>
                </li>
                )) : (
                    <p className="text-sm text-muted-foreground text-center pt-4">{t('noUpcomingEvents')}</p>
                )}
            </ul>
          )}
        </CardContent>
      </Card>

      <RecentMemosCard />

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" />
            <CardTitle>{t('toDoList')}</CardTitle>
          </div>
          <CardDescription>{t('quickLookAtTasks')}</CardDescription>
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
