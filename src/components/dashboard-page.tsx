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
} from 'lucide-react';
import {
  mockCalendarEvents,
  mockMemos,
  mockTasks,
  mockDataString,
} from '@/lib/data';
import {getPersonalizedInsights} from '@/ai/flows/get-personalized-insights';
import {useToast} from '@/hooks/use-toast';

function IskylarInsightsCard() {
  const [insights, setInsights] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const {toast} = useToast();

  const handleGetInsights = async () => {
    setLoading(true);
    setInsights('');
    try {
      const result = await getPersonalizedInsights({
        memos: mockDataString.memos,
        tasks: mockDataString.tasks,
        calendarEvents: mockDataString.calendarEvents,
      });
      setInsights(result.insights);
    } catch (error) {
      console.error('Error getting insights:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get insights from iSkylar.',
      });
    } finally {
      setLoading(false);
    }
  };

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
        {insights && (
          <div className="prose prose-invert max-w-none rounded-lg bg-accent/20 p-4 text-sm text-foreground/90">
            <p className="whitespace-pre-wrap">{insights}</p>
          </div>
        )}
        <Button
          onClick={handleGetInsights}
          disabled={loading}
          className="mt-4 w-full gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>{loading ? 'Thinking...' : "Get Today's Briefing"}</span>
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <IskylarInsightsCard />

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
          <ul className="space-y-2">
            {mockTasks.slice(0, 4).map(task => (
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
        </CardContent>
      </Card>
    </div>
  );
}
