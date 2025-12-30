
'use client';

import * as React from 'react';
import clsx from 'clsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles, X, ChevronUp, Volume2, StopCircle, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRagResponse } from '@/ai/flows/get-rag-response';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { useAuth } from '@/contexts/auth-context';
import { User } from 'lucide-react';

interface Part {
  text?: string;
}

interface Message {
  role: 'user' | 'model';
  content: Part[];
}

type RecordingState = 'idle' | 'recording' | 'processing';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0];
    return names[0][0] + names[names.length - 1][0];
}


export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const { user } = useAuth();
  // @ts-ignore
  const lang = user?.settings?.language || 'en';
  
  const stopSpeaking = React.useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudio(null);
    }
  }, [audio]);

  React.useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
    }
  }, [isOpen, stopSpeaking]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
        // @ts-ignore
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, loading]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    stopSpeaking(); 

    const userMessage: Message = { role: 'user', content: [{ text: input }] };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.'});
        setLoading(false);
        return;
    }
      
    try {
        const response = await getRagResponse({ history: newHistory as any, userId: user.uid });
        
        const assistantMessage: Message = { role: 'model', content: [{ text: response.text }] };
        setMessages(prev => [...prev, assistantMessage]);

        const textResponse = response.text;
        if (textResponse) {
            const { audioDataUri } = await textToSpeech({ text: textResponse });
            if (audioDataUri) {
                const newAudio = new Audio(audioDataUri);
                setAudio(newAudio);
                newAudio.play().catch(console.error);
                newAudio.onended = () => setAudio(null);
            }
        }
    } catch (err) {
            console.error('Error with AI Assistant:', err);
            toast({
                variant: 'destructive',
                title: 'Assistant Error',
                description: 'Failed to get a response from iSkylar.',
            });
    } finally {
        setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setRecordingState('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const result = await transcribeAudio({ audioDataUri: base64Audio, language: lang });
            setInput(result.transcription);
          } catch (error) {
            console.error('Transcription failed:', error);
            toast({
              variant: 'destructive',
              title: 'Processing Error',
              description: 'Failed to process the audio.',
            });
          } finally {
            setRecordingState('idle');
          }
        };
      };

      mediaRecorderRef.current.start();
      setRecordingState('recording');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: 'Could not start recording. Please check microphone permissions.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const isRecording = recordingState === 'recording';
  const isProcessingAudio = recordingState === 'processing';

  return (
    <div className="fixed bottom-4 right-4 z-50">
        <div className={clsx("transition-opacity duration-300 ease-in-out", { 'opacity-100': isOpen, 'opacity-0 hidden': !isOpen })}>
           <Card className="w-[400px] h-[600px] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary">
                            <AvatarImage src="https://picsum.photos/seed/1/100/100" data-ai-hint="woman face" />
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>iSkylar</CardTitle>
                            <CardDescription>Your AI Assistant</CardDescription>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                     <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-6">
                            {messages.map((message, index) => {
                                const textContent = message.content.map(p => p.text).filter(Boolean).join('\n');
                                if (!textContent) return null;

                                return (
                                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                        {message.role === 'model' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="https://picsum.photos/seed/1/100/100" data-ai-hint="woman face" />
                                                <AvatarFallback>AI</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`rounded-lg p-3 max-w-sm text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="whitespace-pre-wrap">{textContent}</p>
                                        </div>
                                        {message.role === 'user' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : <User />}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                )
                            })}
                            {loading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://picsum.photos/seed/1/100/100" data-ai-hint="woman face" />
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg p-3 max-w-sm text-sm bg-muted flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin"/> Thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                        {audio && (
                            <Button variant="outline" onClick={stopSpeaking} className="w-full mb-2">
                                <StopCircle className="mr-2 h-4 w-4"/> Stop Speaking
                            </Button>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about your day or app features..."
                                className="flex-grow resize-none"
                                disabled={loading || isRecording || isProcessingAudio}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e as any);
                                    }
                                }}
                            />
                            {isRecording ? (
                                <Button type="button" size="icon" variant="destructive" onClick={handleStopRecording} aria-label="Stop recording">
                                    <StopCircle />
                                </Button>
                            ) : (
                                <Button type="button" size="icon" onClick={handleStartRecording} aria-label="Start recording" disabled={loading || isProcessingAudio}>
                                    {isProcessingAudio ? <Loader2 className="animate-spin" /> : <Mic />}
                                </Button>
                            )}
                            <Button type="submit" size="icon" aria-label="Send" disabled={loading || isRecording || isProcessingAudio || !input.trim()}>
                                {loading ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </form>
                    </div>
                </CardContent>
           </Card>
        </div>

      <Button 
        size="icon" 
        className={clsx("rounded-full w-14 h-14 shadow-lg transition-all duration-300 ease-in-out", { 'opacity-0 -translate-y-5 pointer-events-none': isOpen, 'opacity-100 translate-y-0': !isOpen })}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  );
}

    