'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Calendar} from '@/components/ui/calendar';
import {Badge} from '@/components/ui/badge';
import {addDays, format, isSameDay, parseISO} from 'date-fns';
import { useTasks } from '@/contexts/task-context';
import { useCalendar } from '@/contexts/calendar-context';
import { CreateEventDialog } from './create-event-dialog';
import { Skeleton } from './ui/skeleton';

export function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { tasks, loading: tasksLoading } = useTasks();
  const { events, loading: eventsLoading } = useCalendar();

  const eventsForSelectedDate = React.useMemo(() => {
    if (!date) return [];
    const dayTasks = tasks
        .filter(task => isSameDay(parseISO(task.dueDate), date))
        .map(task => ({ ...task, type: 'task' }));

    const dayEvents = events
        .filter(event => isSameDay(event.startTime, date))
        .map(event => ({ ...event, type: 'event' }));

    // @ts-ignore
    return [...dayTasks, ...dayEvents].sort((a, b) => {
        const timeA = a.type === 'event' ? a.startTime.getTime() : parseISO(a.dueDate).getTime();
        const timeB = b.type === 'event' ? b.startTime.getTime() : parseISO(b.dueDate).getTime();
        return timeA - timeB;
    });
  }, [date, tasks, events]);

  const modifiers = {
    withTask: tasks.map(task => parseISO(task.dueDate)),
    withEvent: events.map(event => event.startTime),
  };

  const modifiersClassNames = {
    withTask: 'bg-primary/20 rounded-full',
    withEvent: 'bg-accent/50 rounded-full',
  };

  const loading = tasksLoading || eventsLoading;

  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <CreateEventDialog />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardContent className="p-2">
                {loading ? (
                    <Skeleton className="w-full h-[360px]" />
                ) : (
                    <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    />
                )}
            </CardContent>
            </Card>
        </div>

        <div>
            <Card>
            <CardHeader>
                <CardTitle>
                Schedule for{' '}
                {date ? format(date, 'MMMM d, yyyy') : 'No date selected'}
                </CardTitle>
                <CardDescription>
                Tasks and events for the selected day.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : (
                <ul className="space-y-4">
                {eventsForSelectedDate.length > 0 ? (
                    eventsForSelectedDate.map((item, index) => (
                    <li
                        key={index}
                        className="flex items-start gap-3 rounded-md border p-3"
                    >
                        <div className="flex-shrink-0">
                        {item.type === 'task' ? (
                            <Badge variant="secondary">Task</Badge>
                        ) : (
                            <Badge variant="default">Event</Badge>
                        )}
                        </div>
                        <div>
                        <p className="font-medium">{item.title}</p>
                        {item.type === 'event' && (
                            <p className="text-sm text-muted-foreground">
                                {format(item.startTime, 'p')} - {format(item.endTime, 'p')}
                                {item.location && ` @ ${item.location}`}
                            </p>
                        )}
                        {item.type === 'task' && (
                            <p className={`text-sm ${item.completed ? 'text-green-400' : 'text-yellow-400'}`}>
                            {item.completed ? 'Completed' : 'Pending'}
                            </p>
                        )}
                        </div>
                    </li>
                    ))
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                    No events or tasks for this day.
                    </p>
                )}
                </ul>
                )}
            </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
}
