'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Mic, StopCircle, Sparkles, Bot, Pencil } from 'lucide-react';
import { useContacts } from '@/contexts/contact-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { parseContactString } from '@/ai/flows/parse-contact-string';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '@/contexts/auth-context';

type RecordingState = 'idle' | 'recording' | 'processing';

function AIContactCreator({ formRef, setAiRequest, aiRequest }: { formRef: React.RefObject<HTMLFormElement>, setAiRequest: (value: string) => void, aiRequest: string }) {
    const [isParsing, setIsParsing] = React.useState(false);
    const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const { toast } = useToast();
    const { user } = useAuth();
    // @ts-ignore
    const lang = user?.settings?.language || 'en';

    const handleParse = async () => {
        if (!aiRequest.trim()) return;
        setIsParsing(true);
        try {
          const result = await parseContactString({ contactString: aiRequest });
          const form = formRef.current;
          if (form) {
             (form.elements.namedItem('name') as HTMLInputElement).value = result.name;
             (form.elements.namedItem('email') as HTMLInputElement).value = result.email;
             (form.elements.namedItem('title') as HTMLInputElement).value = result.title;
             (form.elements.namedItem('company') as HTMLInputElement).value = result.company;
             (form.elements.namedItem('notes') as HTMLTextAreaElement).value = result.notes;
          }
          toast({ title: 'Fields Populated', description: 'Review the details and click save.' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not understand the contact details.' });
        } finally {
          setIsParsing(false);
        }
    };
    
    const handleStartRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({audio: true});
          mediaRecorderRef.current = new MediaRecorder(stream);
          audioChunksRef.current = [];
          mediaRecorderRef.current.ondataavailable = event => {
            audioChunksRef.current.push(event.data);
          };
          mediaRecorderRef.current.onstop = async () => {
            setRecordingState('processing');
            const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              try {
                const result = await transcribeAudio({ audioDataUri: base64Audio, language: lang });
                setAiRequest(result.transcription);
              } catch (error) {
                console.error('Transcription failed:', error);
                toast({ variant: 'destructive', title: 'Processing Error', description: 'Failed to process the audio.' });
              } finally {
                setRecordingState('idle');
              }
            };
          };
          mediaRecorderRef.current.start();
          setRecordingState('recording');
        } catch (err) {
          toast({ variant: 'destructive', title: 'Recording Error', description: 'Could not start recording. Please check microphone permissions.' });
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
        <div className="space-y-2">
            <Label htmlFor="ai-request">Create with AI</Label>
            <div className="flex gap-2">
            <Input 
                id="ai-request" 
                placeholder="e.g. 'Add Jane Doe, CEO of Innovate Inc...'"
                value={aiRequest}
                onChange={(e) => setAiRequest(e.target.value)}
                disabled={isRecording || isProcessingAudio || isParsing}
            />
            {isRecording ? (
                <Button type="button" size="icon" variant="destructive" onClick={handleStopRecording} aria-label="Stop recording">
                    <StopCircle />
                </Button>
            ) : (
                <Button type="button" size="icon" onClick={handleStartRecording} aria-label="Start recording" disabled={isProcessingAudio || isParsing}>
                    {isProcessingAudio ? <Loader2 className="animate-spin" /> : <Mic />}
                </Button>
            )}
            <Button type="button" size="icon" onClick={handleParse} aria-label="Parse with AI" disabled={!aiRequest.trim() || isParsing || isRecording || isProcessingAudio}>
                {isParsing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            </Button>
            </div>
      </div>
    );
}


export function CreateContactForm() {
  const [loading, setLoading] = React.useState(false);
  const [aiRequest, setAiRequest] = React.useState('');
  
  const formRef = React.useRef<HTMLFormElement>(null);
  const { addContact } = useContacts();
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

    if (!name || !email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide at least a name and an email.',
      });
      return;
    }
    
    setLoading(true);
    try {
      await addContact({
        name,
        email,
        title: (form.elements.namedItem('title') as HTMLInputElement).value || '',
        company: (form.elements.namedItem('company') as HTMLInputElement).value || '',
        notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value || '',
        lastContact: format(new Date(), 'yyyy-MM-dd'),
      });
      toast({
        title: 'Contact Created',
        description: `"${name}" has been added to your contacts.`,
      });
      form.reset();
      setAiRequest('');
    } catch (error) {
      console.error("Error creating contact: ", error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'There was a problem saving your contact.',
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-2"><Bot /> AI Creation</TabsTrigger>
            <TabsTrigger value="manual" className="gap-2"><Pencil /> Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="pt-4">
             <AIContactCreator formRef={formRef} aiRequest={aiRequest} setAiRequest={setAiRequest} />
        </TabsContent>
        <TabsContent value="manual">
            {/* The manual tab is just for showing the form, AI tab can populate it */}
        </TabsContent>
      </Tabs>
      
      <form ref={formRef} onSubmit={handleSave} className="grid gap-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" />
            </div>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
        </div>
        <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Contact
            </Button>
        </div>
      </form>
    </>
  );
}
