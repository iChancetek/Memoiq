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
import {PlusCircle, Sparkles, Loader2, ListPlus, User} from 'lucide-react';
import { type Task, type Contact } from '@/lib/data';
import {useToast} from '@/hooks/use-toast';
import {parseTaskString} from '@/ai/flows/parse-task-string';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTasks } from '@/contexts/task-context';
import { Skeleton } from './ui/skeleton';

export function TasksPage() {
  const { tasks, toggleTask, toggleSubtask, addTask, loading: tasksLoading } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);
  const {toast} = useToast();

  // This will be replaced with live contact data in a future step.
  const mockContacts: Contact[] = [];
  const contactsMap = React.useMemo(() => {
    const map = new Map<string, Contact>();
    mockContacts.forEach(contact => map.set(contact.id, contact));
    return map;
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setIsParsing(true);
    try {
      const result = await parseTaskString({
        taskString: newTaskTitle,
        contacts: JSON.stringify(mockContacts),
        context: `Existing tasks: ${JSON.stringify(tasks.map(t => t.title))}`
      });
      
      await addTask({
        title: result.title,
        dueDate: result.dueDate,
        subtasks: result.subtasks.map((sub, i) => ({ id: `${Date.now()}-${i}`, title: sub, completed: false })),
        contactIds: result.contactIds.map(String),
      });

      setNewTaskTitle('');
      toast({
        title: 'Task Added',
        description: `"${result.title}" has been added to your list.`,
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

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Tasks</CardTitle>
          <CardDescription>
            Add, view, and complete your to-do items. Mention contacts by name to link them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="e.g., 'Follow up with Olivia Chen about Project Phoenix'"
              className="flex-grow"
              disabled={isParsing}
            />
            <Button type="submit" size="icon" aria-label="Add task" disabled={isParsing || tasksLoading}>
              {isParsing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px] text-center">Contacts</TableHead>
                  <TableHead className="w-[120px] text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-5 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : tasks.map(task => (
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
                       <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {task.contactIds?.map(id => {
                            const contact = contactsMap.get(id);
                            if (!contact) return null;
                            return (
                               <Tooltip key={id}>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="gap-1.5 pl-1.5">
                                      <User className="h-3 w-3" />
                                      {contact.name.split(' ')[0]}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{contact.name}</p>
                                  <p className="text-sm text-muted-foreground">{contact.company}</p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {task.dueDate}
                      </TableCell>
                    </TableRow>
                    {task.subtasks && task.subtasks.length > 0 && (
                       <TableRow className={`bg-muted/20 ${task.completed ? 'opacity-60' : ''}`}>
                           <TableCell colSpan={4} className="py-2 pl-16 pr-4">
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
          {!tasksLoading && tasks.length === 0 && (
            <div className="mt-6 py-12 text-center text-muted-foreground">
              <ListPlus className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">You have no tasks</h3>
              <p className="mt-1 text-sm">Add one above to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
