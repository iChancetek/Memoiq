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
import {mockTasks, mockCalendarEvents} from '@/lib/data';
import {addDays, format, isSameDay, parseISO} from 'date-fns';

export function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const eventsForSelectedDate = React.useMemo(() => {
    if (!date) return [];
    const tasks = mockTasks.filter(task =>
      isSameDay(parseISO(task.dueDate), date)
    );
    const calendarEvents = mockCalendarEvents.filter(event => {
      // This is a simplified logic. In a real app, event dates would be stored properly.
      // For now, let's pretend some events are today.
      if (event.id === 1 || event.id === 2 || event.id === 3) {
        return isSameDay(new Date(), date);
      }
      return false;
    });
    return [...tasks, ...calendarEvents];
  }, [date]);

  const modifiers = {
    // Highlight days with tasks
    withTask: mockTasks.map(task => parseISO(task.dueDate)),
    // Highlight days with events (mocking today for events)
    withEvent: [new Date()],
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
