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

// Mock data will be replaced later
const mockCalendarEvents: any[] = [];

export function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { tasks } = useTasks();

  const eventsForSelectedDate = React.useMemo(() => {
    if (!date) return [];
    const dayTasks = tasks.filter(task =>
      isSameDay(parseISO(task.dueDate), date)
    );
    const calendarEvents = mockCalendarEvents.filter(event => {
      // This is a simplified logic. In a real app, event dates would be stored properly.
      return isSameDay(new Date(), date);
    });
    return [...dayTasks, ...calendarEvents];
  }, [date, tasks]);

  const modifiers = {
    withTask: tasks.map(task => parseISO(task.dueDate)),
    withEvent: [new Date()], // Mocking today for events
  };

  const modifiersClassNames = {
    withTask: 'bg-primary/20 rounded-full',
    withEvent: 'bg-accent/50 rounded-full',
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
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
            <ul className="space-y-4">
              {eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <div className="flex-shrink-0">
                      {'dueDate' in item ? (
                        <Badge variant="secondary">Task</Badge>
                      ) : (
                        <Badge variant="default">Event</Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {'time' in item && (
                        <p className="text-sm text-muted-foreground">
                          {item.time} - {item.location}
                        </p>
                      )}
                       {'completed' in item && (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
