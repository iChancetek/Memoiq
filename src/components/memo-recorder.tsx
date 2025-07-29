'use client';
import *
as React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Mic, StopCircle, Loader2, Save} from 'lucide-react';
import {transcribeAndSummarizeMemo} from '@/ai/flows/transcribe-and-summarize-memo';
import {useToast} from '@/hooks/use-toast';
import {Textarea} from './ui/textarea';
import type {Memo} from '@/lib/data';
import {Input} from './ui/input';

interface MemoRecorderProps {
  onSave: (memo: Omit<Memo, 'id'>) => void;
  onFinish: () => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'finished';

export function MemoRecorder({onSave, onFinish}: MemoRecorderProps) {
  const [recordingState, setRecordingState] =
    React.useState<RecordingState>('idle');
  const [transcription, setTranscription] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [title, setTitle] = React.useState('');
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const {toast} = useToast();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setRecordingState('processing');
        const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
        audioChunksRef.current = [];

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const result = await transcribeAndSummarizeMemo({
              audioDataUri: base64Audio,
            });
            setTranscription(result.transcription);
            setSummary(result.summary);
            setTitle(result.summary.substring(0, 50)); // Auto-generate title
            setRecordingState('finished');
          } catch (error) {
            console.error('Transcription/Summarization failed:', error);
            toast({
              variant: 'destructive',
              title: 'Processing Error',
              description: 'Failed to process the audio memo.',
            });
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
      // Stop all tracks to turn off the microphone indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSave = () => {
    if (title && summary) {
      onSave({
        title,
        summary,
        date: new Date().toLocaleDateString('en-CA'),
      });
      onFinish();
    } else {
        toast({
            variant: 'destructive',
            title: 'Cannot Save',
            description: 'Title and summary cannot be empty.'
        })
    }
  };

  const renderContent = () => {
    switch (recordingState) {
      case 'idle':
        return (
          <Button
            onClick={handleStartRecording}
            className="w-full h-24 gap-4 text-lg"
          >
            <Mic className="h-8 w-8" />
            Start Recording
          </Button>
        );
      case 'recording':
        return (
          <Button
            onClick={handleStopRecording}
            variant="destructive"
            className="w-full h-24 gap-4 text-lg"
          >
            <StopCircle className="h-8 w-8" />
            Stop Recording
          </Button>
        );
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center h-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing your memo...</p>
          </div>
        );
      case 'finished':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label htmlFor="summary" className="text-sm font-medium">Summary</label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>
             <div>
              <label htmlFor="transcription" className="text-sm font-medium">Full Transcription</label>
              <Textarea
                id="transcription"
                value={transcription}
                readOnly
                className="mt-1 min-h-[120px] bg-muted/50"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {recordingState === 'finished' ? 'Review Memo' : 'Record a new memo'}
        </DialogTitle>
        <DialogDescription>
          {recordingState === 'finished'
            ? 'Edit the title and summary before saving.'
            : 'Click start to record your voice. Your memo will be transcribed and summarized.'}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">{renderContent()}</div>
      <DialogFooter>
        <Button variant="outline" onClick={onFinish}>
          Cancel
        </Button>
        {recordingState === 'finished' && (
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Memo
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
