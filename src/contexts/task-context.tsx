'use client';

import * as React from 'react';
import { mockTasks, type Task } from '@/lib/data';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks' | 'contactIds'>) => void;
  toggleTask: (taskId: number) => void;
  toggleSubtask: (taskId: number, subtaskId: number) => void;
}

const TaskContext = React.createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'subtasks' | 'contactIds'>) => {
    const newTask: Task = {
      id: Date.now(),
      title: task.title,
      completed: false,
      dueDate: task.dueDate,
      subtasks: [],
      contactIds: [],
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const toggleTask = (taskId: number) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
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
  };

  return (
    <TaskContext.Provider value={{ tasks, setTasks, addTask, toggleTask, toggleSubtask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = React.useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
