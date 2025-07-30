'use client';

import * as React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent, Dialog, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, setHours, setMinutes } from 'date-fns';
import { useCalendar } from '@/contexts/calendar-context';
import { useToast } from '@/hooks/use-toast';
import { type CalendarEvent } from '@/lib/data';

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return {
    value: format(date, 'HH:mm'),
    label: format(date, 'p'),
  };
});

export function CreateEventDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('10:00');
  const { addEvent } = useCalendar();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title || !date) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a title and a date for the event.',
      });
      return;
    }
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = setMinutes(setHours(date, startHour), startMinute);
    const endDateTime = setMinutes(setHours(date, endHour), endMinute);

    if (startDateTime >= endDateTime) {
      toast({
        variant: 'destructive',
        title: 'Invalid Time',
        description: 'End time must be after start time.',
      });
      return;
    }

    try {
        const newEvent: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> = {
            title,
            location,
            startTime: startDateTime,
            endTime: endDateTime,
        };
        await addEvent(newEvent);
        toast({
            title: 'Event Created',
            description: `"${title}" has been added to your calendar.`,
        });
        setOpen(false);
        // Reset form
        setTitle('');
        setLocation('');
        setDate(new Date());
        setStartTime('09:00');
        setEndTime('10:00');
    } catch (error) {
        console.error("Error creating event: ", error);
        toast({
            variant: 'destructive',
            title: 'Save Error',
            description: 'There was a problem saving your event.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to your calendar. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal col-span-3',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Start Time
            </Label>
            <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                    {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              End Time
            </Label>
            <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                    {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
