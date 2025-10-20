
'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Mic, StopCircle, Loader2, Download, Trash2, Languages, Play, Pause, FileText, FileAudio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScribe, type ScribeEntry } from '@/contexts/scribe-context';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useAuth } from '@/contexts/auth-context';

type RecordingState = 'idle' | 'recording';

function Recorder({ onNewRecording, disabled }: { onNewRecording: (blob: Blob) => void, disabled: boolean }) {
    const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const { toast } = useToast();

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onNewRecording(audioBlob);
                setRecordingState('idle');
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
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
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Scribe</CardTitle>
                <CardDescription>Record meetings and conversations. The AI will transcribe and translate for you.</CardDescription>
            </CardHeader>
            <CardContent>
                {recordingState === 'recording' ? (
                    <Button onClick={handleStopRecording} variant="destructive" className="w-full h-20 text-lg">
                        <StopCircle className="mr-2" /> Stop Recording
                    </Button>
                ) : (
                    <Button onClick={handleStartRecording} className="w-full h-20 text-lg" disabled={disabled}>
                        <Mic className="mr-2" /> Start Recording
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function RecordingItem({ recording, onDelete }: { recording: ScribeEntry, onDelete: (id: string) => void }) {
    const { translateScribeEntry } = useScribe();
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isTranslating, setIsTranslating] = React.useState(false);
    const [currentLanguage, setCurrentLanguage] = React.useState<'en' | 'es'>('en');
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    
    const transcriptionText = currentLanguage === 'en' ? recording.transcription_en : recording.transcription_es;
    const audioUrl = currentLanguage === 'en' ? recording.audioUrl_en : recording.audioUrl_es;

    React.useEffect(() => {
        if(audioUrl) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        return () => {
            audioRef.current?.pause();
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    const handleTranslate = async () => {
        const targetLanguage = currentLanguage === 'en' ? 'es' : 'en';
        
        const sourceText = recording.transcription_en; // Always use English as source for now
        const needsTranslation = targetLanguage === 'es' && !recording.transcription_es;
        const needsAudio = targetLanguage === 'es' && !recording.audioUrl_es;

        if (sourceText && (needsTranslation || needsAudio)) {
             setIsTranslating(true);
             await translateScribeEntry(recording.id, targetLanguage, sourceText);
             setIsTranslating(false);
        }
        setCurrentLanguage(targetLanguage);
    };

    const handleDownload = (type: 'audio' | 'transcript') => {
        const link = document.createElement('a');
        if (type === 'audio') {
            if (!audioUrl) return;
            link.href = audioUrl;
            link.download = `recording-${recording.id}-${currentLanguage}.webm`;
        } else {
            if (!transcriptionText) return;
            const blob = new Blob([transcriptionText], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
            link.download = `transcript-${recording.id}-${currentLanguage}.txt`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{recording.title}</CardTitle>
                <CardDescription>
                    {recording.createdAt?.toDate ? format(recording.createdAt.toDate(), 'PPP p') : 'Processing...'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Button size="icon" variant="outline" onClick={togglePlay} disabled={!audioUrl}>
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <div className="text-sm text-muted-foreground">Play Recording</div>
                </div>
                 <Alert>
                    <AlertTitle className="flex items-center justify-between">
                       <span>Transcription ({currentLanguage.toUpperCase()})</span>
                       <Button size="sm" variant="ghost" onClick={handleTranslate} disabled={isTranslating}>
                           {isTranslating ? <Loader2 className="animate-spin mr-2" /> : <Languages className="mr-2" />}
                           Switch to {currentLanguage === 'en' ? 'ES' : 'EN'}
                       </Button>
                    </AlertTitle>
                    <AlertDescription className="h-48 overflow-y-auto whitespace-pre-wrap p-2 bg-muted/50 rounded-md">
                        {isTranslating ? 'Translating...' : (transcriptionText || 'No transcription available.')}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownload('audio')} disabled={!audioUrl}><FileAudio className="mr-2"/> Download Audio</Button>
                <Button variant="outline" onClick={() => handleDownload('transcript')} disabled={!transcriptionText}><FileText className="mr-2"/> Download Transcript</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive"><Trash2 className="mr-2"/> Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the recording and its transcripts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(recording.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}


export function ScribePage() {
    const { scribeEntries, addScribeEntry, deleteScribeEntry, loading } = useScribe();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);
    const { user } = useAuth();
    
    // @ts-ignore
    const lang = user?.settings?.language || 'en';

    const handleNewRecording = async (audioBlob: Blob) => {
        setIsProcessing(true);
        try {
            await addScribeEntry(audioBlob, lang);
            toast({
                title: 'Processing Complete',
                description: 'Your recording has been transcribed and saved.',
            });
        } catch (error) {
            console.error('Error processing new recording:', error);
            toast({
                variant: 'destructive',
                title: 'Processing Error',
                description: 'Failed to process your new recording.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteScribeEntry(id);
             toast({
                title: 'Recording Deleted',
                description: 'The recording and its transcripts have been removed.',
            });
        } catch (error) {
             console.error('Error deleting recording:', error);
            toast({
                variant: 'destructive',
                title: 'Deletion Error',
                description: 'Failed to delete the recording.',
            });
        }
    }

    return (
        <div className="space-y-6">
            <Recorder onNewRecording={handleNewRecording} disabled={isProcessing} />

            {isProcessing && (
                <Card className="flex items-center justify-center p-8">
                     <Loader2 className="h-8 w-8 animate-spin mr-4" />
                     <p>Processing new recording...</p>
                </Card>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Past Recordings</h3>
                {loading ? (
                     <Card className="flex items-center justify-center p-8">
                         <Loader2 className="h-8 w-8 animate-spin mr-4" />
                         <p>Loading recordings...</p>
                    </Card>
                ) : scribeEntries.length > 0 ? (
                    scribeEntries.map(entry => <RecordingItem key={entry.id} recording={entry} onDelete={handleDelete} />)
                ) : (
                    !isProcessing && (
                    <Card className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">No recordings yet. Click "Start Recording" to begin.</p>
                    </Card>
                    )
                )}
            </div>
        </div>
    );
}
