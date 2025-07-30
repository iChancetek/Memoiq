'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Mic, StopCircle, Loader2, Download, Trash2, Languages, Play, Pause, FileText, FileAudio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScribe } from '@/contexts/scribe-context';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

type RecordingState = 'idle' | 'recording' | 'processing';

function Recorder({ onNewRecording }: { onNewRecording: (blob: Blob) => void }) {
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
                    <Button onClick={handleStartRecording} className="w-full h-20 text-lg">
                        <Mic className="mr-2" /> Start Recording
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function RecordingItem({ recording }: { recording: any }) {
    const { deleteScribeEntry, translateScribeEntry } = useScribe();
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isTranslating, setIsTranslating] = React.useState(false);
    const [currentTranscription, setCurrentTranscription] = React.useState(recording.transcription_en);
    const [currentLanguage, setCurrentLanguage] = React.useState<'en' | 'es'>('en');
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        audioRef.current = new Audio(recording.audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        return () => {
            audioRef.current?.pause();
        };
    }, [recording.audioUrl]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTranslate = async () => {
        setIsTranslating(true);
        const targetLanguage = currentLanguage === 'en' ? 'es' : 'en';
        
        // Use existing translation if available
        const existingTranslation = targetLanguage === 'es' ? recording.transcription_es : recording.transcription_en;

        if (existingTranslation) {
             setCurrentTranscription(existingTranslation);
             setCurrentLanguage(targetLanguage);
        } else {
            // Otherwise, call the AI
             await translateScribeEntry(recording.id, targetLanguage, recording.transcription_en);
             // The context will update the recording, which will re-render this component
             // For now, we'll just switch the local state after the call
             // The updated recording will have the new translation
        }
        setIsTranslating(false);
    };

    const handleDownload = (type: 'audio' | 'transcript') => {
        const link = document.createElement('a');
        if (type === 'audio') {
            link.href = recording.audioUrl;
            link.download = `recording-${recording.id}.webm`;
        } else {
            const blob = new Blob([currentTranscription], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
            link.download = `transcript-${recording.id}-${currentLanguage}.txt`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Switch transcription when recording data changes (e.g., after translation)
    React.useEffect(() => {
        setCurrentTranscription(currentLanguage === 'en' ? recording.transcription_en : recording.transcription_es);
    }, [recording, currentLanguage]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{recording.title}</CardTitle>
                <CardDescription>
                    {recording.createdAt ? format(recording.createdAt.toDate(), 'PPP p') : 'Just now'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Button size="icon" variant="outline" onClick={togglePlay}>
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <div className="text-sm text-muted-foreground">Play Recording</div>
                </div>
                 <Alert>
                    <AlertTitle className="flex items-center justify-between">
                       <span>Transcription ({currentLanguage.toUpperCase()})</span>
                       <Button size="sm" variant="ghost" onClick={handleTranslate} disabled={isTranslating}>
                           {isTranslating ? <Loader2 className="animate-spin" /> : <Languages className="mr-2" />}
                           Switch to {currentLanguage === 'en' ? 'ES' : 'EN'}
                       </Button>
                    </AlertTitle>
                    <AlertDescription className="h-48 overflow-y-auto whitespace-pre-wrap p-2 bg-muted/50 rounded-md">
                        {currentTranscription || "No transcription available."}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownload('audio')}><FileAudio className="mr-2"/> Download Audio</Button>
                <Button variant="outline" onClick={() => handleDownload('transcript')}><FileText className="mr-2"/> Download Transcript</Button>
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
                            <AlertDialogAction onClick={() => deleteScribeEntry(recording.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}


export function ScribePage() {
    const { scribeEntries, addScribeEntry, loading } = useScribe();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleNewRecording = async (audioBlob: Blob) => {
        setIsProcessing(true);
        try {
            await addScribeEntry(audioBlob);
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

    return (
        <div className="space-y-6">
            <Recorder onNewRecording={handleNewRecording} />

            {isProcessing && (
                <Card className="flex items-center justify-center p-8">
                     <Loader2 className="h-8 w-8 animate-spin mr-4" />
                     <p>Processing new recording...</p>
                </Card>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Past Recordings</h3>
                {loading ? (
                     <p>Loading recordings...</p>
                ) : scribeEntries.length > 0 ? (
                    scribeEntries.map(entry => <RecordingItem key={entry.id} recording={entry} />)
                ) : (
                    <p className="text-muted-foreground">No recordings yet. Click "Start Recording" to begin.</p>
                )}
            </div>
        </div>
    );
}
