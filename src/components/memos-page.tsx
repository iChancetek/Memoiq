
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Mic, Plus, Loader2} from 'lucide-react';
import {Dialog, DialogContent, DialogTrigger} from '@/components/ui/dialog';
import {MemoRecorder} from '@/components/memo-recorder';
import type {Memo} from '@/lib/data';
import {useToast} from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const db = getFirestore(firebaseApp);

// Create a context to provide memos throughout the app
const MemoContext = React.createContext<{ memos: Memo[]; loading: boolean }>({ memos: [], loading: true });

export function MemoProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [memos, setMemos] = React.useState<Memo[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (user) {
        setLoading(true);
        const q = query(
            collection(db, 'users', user.uid, 'memos'),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userMemos = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date()
                }
            }) as Memo[];
            setMemos(userMemos);
            setLoading(false);
        });
        return () => unsubscribe();
        } else {
            setMemos([]);
            setLoading(false);
        }
    }, [user]);

    return (
        <MemoContext.Provider value={{ memos, loading }}>
            {children}
        </MemoContext.Provider>
    );
}

export const useMemos = () => React.useContext(MemoContext);

export function MemosPage() {
  const { memos, loading } = useMemos();
  const [isRecording, setIsRecording] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const addMemo = async (newMemo: Omit<Memo, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to save a memo.',
        });
        return;
    }
    try {
        const collectionRef = collection(db, 'users', user.uid, 'memos');
        addDocumentNonBlocking(collectionRef, {
            ...newMemo,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        toast({
            title: 'Memo Saved',
            description: `"${newMemo.title}" has been added to your memos.`,
        });
    } catch (error) {
        console.error("Error saving memo: ", error);
        toast({
            variant: 'destructive',
            title: 'Save Error',
            description: 'There was a problem saving your memo.',
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Memos</h2>
          <p className="text-muted-foreground">
            All your transcribed and summarized voice notes.
          </p>
        </div>
        <Dialog open={isRecording} onOpenChange={setIsRecording}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Memo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <MemoRecorder onSave={addMemo} onFinish={() => setIsRecording(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
             ))}
          </div>
      ) : (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {memos.map(memo => (
                <Card key={memo.id} className="flex flex-col">
                    <CardHeader>
                    <CardTitle className="truncate">{memo.title}</CardTitle>
                    <CardDescription>{new Date(memo.date).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                        {memo.summary}
                    </p>
                    </CardContent>
                    <CardFooter>
                    <Button variant="outline" className="w-full">
                        View Details
                    </Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
            {memos.length === 0 && (
                <div className="py-24 text-center text-muted-foreground">
                    <Mic className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No memos yet</h3>
                    <p>Click "New Memo" to record your first thought.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
}
