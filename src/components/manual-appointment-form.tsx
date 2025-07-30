'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCalendar } from '@/contexts/calendar-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { format, parse } from 'date-fns';

export function ManualAppointmentForm() {
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { addEvent } = useCalendar();
  const { toast } = useToast();
  
  const resetForm = () => {
    setTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill out at least title, date, and start/end times.',
      });
      return;
    }
    
    setLoading(true);
    try {
      const startDateTime = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const endDateTime = parse(`${date} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error("Invalid date or time format.");
      }

      await addEvent({
        title,
        startTime: startDateTime,
        endTime: endDateTime,
        location,
      });

      toast({
        title: 'Appointment Created',
        description: `"${title}" has been added to your calendar.`,
      });
      resetForm();

    } catch (error) {
      console.error('Error creating manual appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'Could not save the appointment. Check your date and time formats.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Team Meeting" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>
       <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Conference Room 1 or Virtual" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Save Appointment
        </Button>
      </div>
    </form>
  );
}
