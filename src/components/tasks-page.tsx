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
import {PlusCircle, Sparkles, Loader2, ListPlus} from 'lucide-react';
import {mockTasks, type Task} from '@/lib/data';
import {useToast} from '@/hooks/use-toast';
import {parseTaskString} from '@/ai/flows/parse-task-string';

export function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);
  const {toast} = useToast();

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setIsParsing(true);
    try {
      const result = await parseTaskString({
        taskString: newTaskTitle,
        context: `Existing tasks: ${JSON.stringify(tasks.map(t => t.title))}`
      });

      const newTask: Task = {
        id: Date.now(),
        title: result.title,
        completed: false,
        dueDate: result.dueDate,
        subtasks: result.subtasks.map((sub, i) => ({ id: Date.now() + i + 1, title: sub, completed: false })),
      };
      setTasks(prevTasks => [newTask, ...prevTasks]);
      setNewTaskTitle('');
      toast({
        title: 'Task Added',
        description: `"${newTask.title}" has been added to your list.`,
      });
    } catch (error) {
       console.error("Failed to parse task:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Could not understand the task. Please try rephrasing.",
       });
    } finally {
        setIsParsing(false);
    }
  };

  const toggleTask = (taskId: number) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId ? {...task, completed: !task.completed} : task
      )
    );
  };
  
  const toggleSubtask = (taskId: number, subtaskId: number) => {
    setTasks(tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                subtasks: task.subtasks?.map(sub => 
                    sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
                )
            }
        }
        return task;
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Your Tasks</CardTitle>
        <CardDescription>
          Add, view, and complete your to-do items. Use natural language to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="e.g., 'Finish the proposal by Thursday afternoon'"
            className="flex-grow"
            disabled={isParsing}
          />
          <Button type="submit" size="icon" aria-label="Add task" disabled={isParsing}>
            {isParsing ? <Loader2 className="animate-spin" /> : <Sparkles />}
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
                <React.Fragment key={task.id}>
                  <TableRow
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
                  {task.subtasks && task.subtasks.length > 0 && (
                     <TableRow className={`bg-muted/20 ${task.completed ? 'opacity-60' : ''}`}>
                         <TableCell colSpan={3} className="py-2 pl-16 pr-4">
                            <div className="space-y-2">
                                {task.subtasks.map(subtask => (
                                     <div key={subtask.id} className="flex items-center gap-3">
                                        <Checkbox
                                          checked={subtask.completed}
                                          onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                                          aria-label={`Mark subtask "${subtask.title}" as ${
                                            subtask.completed ? 'incomplete' : 'complete'
                                          }`}
                                        />
                                        <span className={`text-sm ${subtask.completed ? "text-muted-foreground line-through" : ""}`}>
                                            {subtask.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                         </TableCell>
                     </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        {tasks.length === 0 && (
          <div className="mt-6 py-12 text-center text-muted-foreground">
            <ListPlus className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">You have no tasks</h3>
            <p className="mt-1 text-sm">Add one above to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
