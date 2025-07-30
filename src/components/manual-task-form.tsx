'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

export function ManualTaskForm() {
  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { addTask } = useTasks();
  const { toast } = useToast();
  
  const resetForm = () => {
    setTitle('');
    setDueDate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast({
        variant: 'destructive',
        title: 'Missing Title',
        description: 'Please provide a title for the task.',
      });
      return;
    }
    
    setLoading(true);
    try {
      await addTask({
        title,
        dueDate: dueDate,
      });

      toast({
        title: 'Task Created',
        description: `"${title}" has been added to your list.`,
      });
      resetForm();

    } catch (error) {
      console.error('Error creating manual task:', error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'Could not save the task.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Finish report" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="date">Due Date</Label>
                <Input id="date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
        </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Save Task
        </Button>
      </div>
    </form>
  );
}
