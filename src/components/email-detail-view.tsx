'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from './ui/skeleton';
import { Mail, Sparkles, Send, Loader2, Bot, Volume2, StopCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { Email } from '@/contexts/email-context';
import { summarizeEmail } from '@/ai/flows/summarize-email';
import { draftEmailReply } from '@/ai/flows/draft-email-reply';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';

type AIAction = 'summarize' | 'reply' | 'read';

export function EmailDetailView({ email, isLoading }: { email: Email | null; isLoading: boolean }) {
  const [aiResult, setAiResult] = React.useState<any>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [activeAiAction, setActiveAiAction] = React.useState<AIAction | null>(null);
  const [replyContext, setReplyContext] = React.useState('');
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentAudioUri, setCurrentAudioUri] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stopSpeaking = React.useCallback(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentAudioUri(null);
    }
  }, []);

  React.useEffect(() => {
    // Reset AI state and stop audio when email changes
    setAiResult(null);
    setIsAiLoading(false);
    setActiveAiAction(null);
    setReplyContext('');
    stopSpeaking();
  }, [email, stopSpeaking]);

  React.useEffect(() => {
    if (currentAudioUri) {
        audioRef.current = new Audio(currentAudioUri);
        const audio = audioRef.current;
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handlePause);

        audio.play().catch(err => {
            console.error("Audio playback failed:", err);
            setIsPlaying(false);
        });

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handlePause);
            audio.pause();
            audioRef.current = null;
        }
    }
  }, [currentAudioUri]);

  const handleAiAction = async (action: AIAction) => {
    if (!email) return;

    setIsAiLoading(true);
    setAiResult(null);
    setActiveAiAction(action);
    stopSpeaking();

    try {
      if (action === 'summarize') {
        const result = await summarizeEmail({
          from: email.from || 'Unknown',
          subject: email.subject || 'No Subject',
          body: email.textBody || email.htmlBody || '',
        });
        setAiResult(result);
      } else if (action === 'reply') {
        const result = await draftEmailReply({
            from: email.from || 'Unknown',
            subject: email.subject || 'No Subject',
            body: email.textBody || email.htmlBody || '',
            userContext: replyContext || 'Draft a professional and helpful response.',
        });
        setAiResult(result);
      } else if (action === 'read') {
        const readableText = email.textBody || email.subject;
        if (!readableText) {
          toast({ variant: 'destructive', title: 'Nothing to read', description: 'This email has no text content.'});
          return;
        }
        const { audioDataUri } = await textToSpeech({ text: readableText });
        setCurrentAudioUri(audioDataUri);
      }
    } catch (error) {
      console.error(`Error with AI action (${action}):`, error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: `Could not perform AI action. Please try again.`,
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Mail className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No Email Selected</h3>
          <p>Select an email from the list to view its details.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="truncate">{email.subject}</CardTitle>
        <CardDescription>
          From: {email.from} | Received: {(email.receivedAt as Timestamp)?.toDate && format((email.receivedAt as Timestamp).toDate(), 'PPP p')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {email.htmlBody ? (
           <iframe
                srcDoc={email.htmlBody}
                className="w-full h-full border rounded-md bg-white"
                sandbox="allow-same-origin" // Security precaution
            />
        ) : (
            <p className="whitespace-pre-wrap text-sm">{email.textBody || 'No content to display.'}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 border-t pt-4">
         <div className="flex flex-wrap gap-2">
            {isPlaying ? (
                <Button variant="destructive" onClick={stopSpeaking}>
                    <StopCircle className="mr-2" /> Stop Speaking
                </Button>
            ) : (
                <Button variant="outline" onClick={() => handleAiAction('read')} disabled={isAiLoading}>
                    {isAiLoading && activeAiAction === 'read' ? <Loader2 className="animate-spin mr-2"/> : <Volume2 className="mr-2" />}
                    {isAiLoading && activeAiAction === 'read' ? 'Preparing...' : 'Read Aloud'}
                </Button>
            )}
            <Button variant="outline" onClick={() => handleAiAction('summarize')} disabled={isAiLoading}>
                <Sparkles className="mr-2" /> {isAiLoading && activeAiAction === 'summarize' ? 'Summarizing...' : 'Summarize'}
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Send className="mr-2" /> Draft Reply
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Draft a Reply</DialogTitle>
                        <DialogDescription>Provide optional context for the AI to draft a better reply.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="reply-context">Context (Optional)</Label>
                        <Textarea 
                            id="reply-context"
                            placeholder="e.g., 'Accept the invitation but mention I'll be 15 minutes late.'"
                            value={replyContext}
                            onChange={(e) => setReplyContext(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" onClick={() => handleAiAction('reply')} disabled={isAiLoading}>
                                {isAiLoading && activeAiAction === 'reply' ? <Loader2 className="mr-2 animate-spin"/> : <Sparkles className="mr-2" />}
                                Generate Draft
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         </div>
         
         {isAiLoading && activeAiAction !== 'read' && (
            <div className="w-full p-4 border rounded-lg flex items-center gap-3 text-muted-foreground">
                <Loader2 className="animate-spin" />
                <p>iSkylar is thinking...</p>
            </div>
         )}
         
         {aiResult && activeAiAction === 'summarize' && (
            <Card className="bg-muted/50 w-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Bot /> AI Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Summary</h4>
                        <p className="text-sm">{aiResult.summary}</p>
                    </div>
                    {aiResult.actionItems?.length > 0 && (
                        <div>
                             <h4 className="font-semibold mb-2">Action Items</h4>
                             <ul className="list-disc list-inside space-y-1 text-sm">
                                {aiResult.actionItems.map((item: string, index: number) => <li key={index}>{item}</li>)}
                             </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
         )}

        {aiResult && activeAiAction === 'reply' && (
            <Card className="bg-muted/50 w-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Bot /> AI-Drafted Reply</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        value={aiResult.replyBody}
                        className="h-48 bg-background"
                        readOnly // For now, the user can copy-paste this
                    />
                    <p className="text-xs text-muted-foreground mt-2">You can copy this draft into your email client.</p>
                </CardContent>
            </Card>
         )}

      </CardFooter>
    </Card>
  );
}
