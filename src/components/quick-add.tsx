'use client';

import * as React from 'react';
import {Button} from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Plus, Sparkles, Loader2} from 'lucide-react';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { parseTaskString } from '@/ai/flows/parse-task-string';
import { useContacts } from '@/contexts/contact-context';

export function QuickAdd() {
  const { addTask, loading: tasksLoading } = useTasks();
  const { contacts } = useContacts();
  const [isParsing, setIsParsing] = React.useState(false);
  const { toast } = useToast();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const taskString = formData.get('taskString') as string;
    
    if (taskString.trim()) {
      setIsParsing(true);
      try {
        const result = await parseTaskString({
          taskString: taskString,
          contacts: JSON.stringify(contacts), 
          context: `Existing tasks: ${JSON.stringify(useTasks.getState().tasks.map(t => t.title))}`
        });

        await addTask({
          title: result.title,
          dueDate: result.dueDate,
          subtasks: result.subtasks.map((sub, i) => ({ id: `${Date.now()}-${i}`, title: sub, completed: false })),
          contactIds: result.contactIds.map(String),
        });

        toast({
          title: "Task Added",
          description: `"${result.title}" has been added to your list.`,
        });
        
        closeRef.current?.click();
        (event.target as HTMLFormElement).reset();
      } catch (error) {
         console.error("Failed to parse task:", error);
         toast({
           variant: "destructive",
           title: "AI Error",
           description: "Could not understand the task. Please try rephrasing.",
         });
      } finally {
          setIsParsing(false);
      }
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
                <Label htmlFor="taskString">Describe your task</Label>
                <Input
                  id="taskString"
                  name="taskString"
                  placeholder="e.g. Follow up with Acme Corp next Friday"
                  required
                  disabled={isParsing || tasksLoading}
                />
              </div>
              <Button type="submit" className="mt-4" disabled={isParsing || tasksLoading}>
                {isParsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {isParsing ? 'Parsing...' : 'Add Task with AI'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <SheetClose ref={closeRef} className="hidden" />
      </SheetContent>
    </Sheet>
  );
}
