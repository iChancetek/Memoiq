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
import {Mic, Plus} from 'lucide-react';
import {Dialog, DialogContent, DialogTrigger} from '@/components/ui/dialog';
import {MemoRecorder} from '@/components/memo-recorder';
import {mockMemos, type Memo} from '@/lib/data';
import {useToast} from '@/hooks/use-toast';

export function MemosPage() {
  const [memos, setMemos] = React.useState<Memo[]>(mockMemos);
  const [isRecording, setIsRecording] = React.useState(false);
  const {toast} = useToast();

  const addMemo = (newMemo: Omit<Memo, 'id'>) => {
    const memoWithId = {id: Date.now(), ...newMemo};
    setMemos(prevMemos => [memoWithId, ...prevMemos]);
    toast({
      title: 'Memo Saved',
      description: `"${newMemo.title}" has been added to your memos.`,
    });
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {memos.map(memo => (
          <Card key={memo.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="truncate">{memo.title}</CardTitle>
              <CardDescription>{memo.date}</CardDescription>
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
    </div>
  );
}
