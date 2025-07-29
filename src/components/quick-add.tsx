'use client';

import {Button} from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Plus} from 'lucide-react';
import type {Task} from '@/lib/data';

interface QuickAddProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
}

export function QuickAdd({onAddTask}: QuickAddProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const dueDate = formData.get('dueDate') as string;
    if (title && dueDate) {
      onAddTask({title, dueDate});
      // Here you might want to close the sheet and show a toast
    }
  };

  return (
    <Sheet>
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
            Quickly add a new task, memo, or event to your workspace.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="task" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="memo" disabled>
              Memo
            </TabsTrigger>
            <TabsTrigger value="event" disabled>
              Event
            </TabsTrigger>
          </TabsList>
          <TabsContent value="task">
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Follow up with Acme Corp"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" required />
              </div>
              <Button type="submit" className="mt-4">
                Add Task
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
