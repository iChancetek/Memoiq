
'use client';

import * as React from 'react';
import { type Task, type Subtask } from '@/lib/data';
import { useAuth } from './auth-context';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'userId' | 'completed' | 'createdAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  loading: boolean;
}

const TaskContext = React.createContext<TaskContextType | undefined>(undefined);
const db = getFirestore(firebaseApp);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      setLoading(true);
      const q = query(
        collection(db, 'users', user.uid, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];
        setTasks(userTasks);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const addTask = async (task: Omit<Task, 'id' | 'userId' | 'completed' | 'createdAt'>) => {
    if (!user) throw new Error("User not authenticated");
    const { title, dueDate, subtasks, contactIds } = task;
    const collectionRef = collection(db, 'users', user.uid, 'tasks');
    addDocumentNonBlocking(collectionRef, {
      title,
      dueDate,
      subtasks: subtasks || [],
      contactIds: contactIds || [],
      userId: user.uid,
      completed: false,
      createdAt: serverTimestamp(),
    });
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    updateDocumentNonBlocking(taskRef, updates);
  };
  
  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    deleteDocumentNonBlocking(taskRef);
  }

  const toggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { completed: !task.completed });
    }
  };
  
  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const newSubtasks = task.subtasks.map(sub =>
        sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
      );
      updateTask(taskId, { subtasks: newSubtasks });
    }
  };

  const value = { tasks, addTask, updateTask, deleteTask, toggleTask, toggleSubtask, loading };

  return (
    <TaskContext.Provider value={value}>
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
