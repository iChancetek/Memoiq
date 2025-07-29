'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {PlusCircle} from 'lucide-react';
import {mockTasks, type Task} from '@/lib/data';
import {useToast} from '@/hooks/use-toast';

export function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const {toast} = useToast();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
      dueDate: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-CA'), // 3 days from now
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskTitle('');
    toast({
      title: 'Task Added',
      description: `"${newTask.title}" has been added to your list.`,
    });
  };

  const toggleTask = (taskId: number) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId ? {...task, completed: !task.completed} : task
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Your Tasks</CardTitle>
        <CardDescription>
          Add, view, and complete your to-do items.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-grow"
          />
          <Button type="submit" size="icon" aria-label="Add task">
            <PlusCircle />
          </Button>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px]">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow
                  key={task.id}
                  className={task.completed ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      aria-label={`Mark task "${task.title}" as ${
                        task.completed ? 'incomplete' : 'complete'
                      }`}
                    />
                  </TableCell>
                  <TableCell
                    className={`font-medium ${
                      task.completed ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {task.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.dueDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {tasks.length === 0 && (
          <div className="mt-6 text-center text-muted-foreground">
            You have no tasks. Add one above to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
