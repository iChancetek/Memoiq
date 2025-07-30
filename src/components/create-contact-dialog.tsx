'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Mic, StopCircle, Sparkles } from 'lucide-react';
import { useContacts } from '@/contexts/contact-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Separator } from './ui/separator';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { parseContactString } from '@/ai/flows/parse-contact-string';

interface CreateContactDialogProps {
  children: React.ReactNode;
}

type RecordingState = 'idle' | 'recording' | 'processing';

export function CreateContactDialog({ children }: CreateContactDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const [aiRequest, setAiRequest] = React.useState('');
  
  const formRef = React.useRef<HTMLFormElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const { addContact } = useContacts();
  const { toast } = useToast();
  
  // Refs for form fields
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const companyRef = React.useRef<HTMLInputElement>(null);
  const notesRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameRef.current?.value || !emailRef.current?.value) {
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
        name: nameRef.current.value,
        email: emailRef.current.value,
        title: titleRef.current?.value || '',
        company: companyRef.current?.value || '',
        notes: notesRef.current?.value || '',
        lastContact: format(new Date(), 'yyyy-MM-dd'),
      });
      toast({
        title: 'Contact Created',
        description: `"${nameRef.current.value}" has been added to your contacts.`,
      });
      setOpen(false);
      formRef.current?.reset();
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
            const result = await transcribeAudio({ audioDataUri: base64Audio });
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
  
  const handleParse = async () => {
    if (!aiRequest.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseContactString({ contactString: aiRequest });
      if (nameRef.current) nameRef.current.value = result.name;
      if (emailRef.current) emailRef.current.value = result.email;
      if (titleRef.current) titleRef.current.value = result.title;
      if (companyRef.current) companyRef.current.value = result.company;
      if (notesRef.current) notesRef.current.value = result.notes;
      toast({ title: 'Fields Populated', description: 'Review the details and click save.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not understand the contact details.' });
    } finally {
      setIsParsing(false);
    }
  };

  const isRecording = recordingState === 'recording';
  const isProcessingAudio = recordingState === 'processing';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your list. Use the AI to parse details from text or voice.
          </DialogDescription>
        </DialogHeader>
        
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

        <Separator />

        <form ref={formRef} onSubmit={handleSave} className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" name="name" ref={nameRef} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" name="email" type="email" ref={emailRef} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" name="title" ref={titleRef} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input id="company" name="company" ref={companyRef} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea id="notes" name="notes" ref={notesRef} className="col-span-3" />
          </div>
           <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Contact
            </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
