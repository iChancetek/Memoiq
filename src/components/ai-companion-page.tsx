'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles, Bot, User, Volume2, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCompanionResponse } from '@/ai/flows/get-companion-response';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AICompanionPage() {
  const [sessionStarted, setSessionStarted] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
        // @ts-ignore
        scrollAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const stopSpeaking = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudio(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    stopSpeaking(); // Stop any currently playing audio

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await getCompanionResponse({
        message: input,
        history: messages,
      });
      
      const assistantMessage: Message = { role: 'assistant', content: response.text };
      setMessages(prev => [...prev, assistantMessage]);

      if (response.audioDataUri) {
        const newAudio = new Audio(response.audioDataUri);
        setAudio(newAudio);
        newAudio.play().catch(err => {
          console.error("Audio playback failed:", err);
          // Don't show a toast for this, as it can be annoying if it happens often.
        });
        newAudio.onended = () => setAudio(null);
      }

    } catch (error) {
      console.error('Error with AI Companion:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Failed to get a response from iSkylar.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionStarted) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <Bot className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">iSkylar</CardTitle>
            <CardDescription>Your Friendly AI Companion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
                Ready to talk? Start a session to chat with iSkylar about anything on your mind.
            </p>
            <Button onClick={() => setSessionStarted(true)}>
              Start Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <ScrollArea className="flex-1 p-4">
             <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'assistant' && (
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="woman face" />
                                <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`rounded-lg p-3 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                         {message.role === 'user' && (
                            <Avatar className="h-9 w-9">
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                 {loading && (
                     <div className="flex items-start gap-3">
                         <Avatar className="h-9 w-9">
                            <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="woman face" />
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin"/> Thinking...
                        </div>
                     </div>
                 )}
            </div>
            <div ref={scrollAreaRef} />
        </ScrollArea>
        <div className="p-4 border-t max-w-3xl mx-auto w-full">
            {audio && (
                <Button variant="destructive" onClick={stopSpeaking} className="w-full mb-2">
                    <StopCircle className="mr-2 h-4 w-4"/> Stop Speaking
                </Button>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask iSkylar about self-care, wellness, or anything else..."
                    className="flex-grow resize-none"
                    disabled={loading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                        }
                    }}
                />
                <Button type="submit" size="icon" aria-label="Send" disabled={loading || !input.trim()}>
                    {loading ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </div>
    </div>
  );
}
