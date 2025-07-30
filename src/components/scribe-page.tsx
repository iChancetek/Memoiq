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

const locale = {
    en: {
        title: 'AI Scribe',
        description: 'Record meetings and conversations. The AI will transcribe and translate for you.',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        pastRecordings: 'Past Recordings',
        loading: 'Loading recordings...',
        noRecordings: 'No recordings yet. Click "Start Recording" to begin.',
        playRecording: 'Play Recording',
        transcription: 'Transcription',
        switchTo: 'Switch to',
        noTranscription: 'No transcription available.',
        downloadAudio: 'Download Audio',
        downloadTranscript: 'Download Transcript',
        delete: 'Delete',
        deleteConfirmTitle: 'Are you sure?',
        deleteConfirmDescription: 'This action cannot be undone. This will permanently delete the recording and its transcripts.',
        cancel: 'Cancel',
        continue: 'Continue',
        processing: 'Processing new recording...',
    },
    es: {
        title: 'Escriba de IA',
        description: 'Grabe reuniones y conversaciones. La IA transcribirá y traducirá para usted.',
        startRecording: 'Empezar a Grabar',
        stopRecording: 'Dejar de Grabar',
        pastRecordings: 'Grabaciones Anteriores',
        loading: 'Cargando grabaciones...',
        noRecordings: 'Aún no hay grabaciones. Haga clic en "Empezar a Grabar" para comenzar.',
        playRecording: 'Reproducir Grabación',
        transcription: 'Transcripción',
        switchTo: 'Cambiar a',
        noTranscription: 'No hay transcripción disponible.',
        downloadAudio: 'Descargar Audio',
        downloadTranscript: 'Descargar Transcripción',
        delete: 'Eliminar',
        deleteConfirmTitle: '¿Está seguro?',
        deleteConfirmDescription: 'Esta acción no se puede deshacer. Esto eliminará permanentemente la grabación y sus transcripciones.',
        cancel: 'Cancelar',
        continue: 'Continuar',
        processing: 'Procesando nueva grabación...',
    }
}

function Recorder({ onNewRecording, lang, disabled }: { onNewRecording: (blob: Blob) => void, lang: 'en' | 'es', disabled: boolean }) {
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
    
    const t = locale[lang];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {recordingState === 'recording' ? (
                    <Button onClick={handleStopRecording} variant="destructive" className="w-full h-20 text-lg">
                        <StopCircle className="mr-2" /> {t.stopRecording}
                    </Button>
                ) : (
                    <Button onClick={handleStartRecording} className="w-full h-20 text-lg" disabled={disabled}>
                        <Mic className="mr-2" /> {t.startRecording}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function RecordingItem({ recording, lang }: { recording: any, lang: 'en' | 'es' }) {
    const { deleteScribeEntry, translateScribeEntry } = useScribe();
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isTranslating, setIsTranslating] = React.useState(false);
    const [currentLanguage, setCurrentLanguage] = React.useState<'en' | 'es'>(lang);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const t = locale[lang];
    
    const transcriptionText = currentLanguage === 'en' ? recording.transcription_en : recording.transcription_es;


    React.useEffect(() => {
        audioRef.current = new Audio(recording.audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        return () => {
            audioRef.current?.pause();
        };
    }, [recording.audioUrl]);
    
     // Switch to the global language if it changes
    React.useEffect(() => {
        setCurrentLanguage(lang);
    }, [lang]);

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
        setIsTranslating(true);
        const targetLanguage = currentLanguage === 'en' ? 'es' : 'en';
        
        // Determine if we need to fetch the translation
        const needsTranslation = (targetLanguage === 'es' && !recording.transcription_es) || (targetLanguage === 'en' && !recording.transcription_en);

        if (needsTranslation) {
             const textToTranslate = recording.transcription_en; // Always use English as source for simplicity
             await translateScribeEntry(recording.id, targetLanguage, textToTranslate);
        }

        // The context will update the recording, which will re-render this component
        // so we just need to set the language state.
        setCurrentLanguage(targetLanguage);
        setIsTranslating(false);
    };

    const handleDownload = (type: 'audio' | 'transcript') => {
        const link = document.createElement('a');
        if (type === 'audio') {
            link.href = recording.audioUrl;
            link.download = `recording-${recording.id}.webm`;
        } else {
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
                    {recording.createdAt?.toDate ? format(recording.createdAt.toDate(), 'PPP p') : 'Just now'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Button size="icon" variant="outline" onClick={togglePlay}>
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <div className="text-sm text-muted-foreground">{t.playRecording}</div>
                </div>
                 <Alert>
                    <AlertTitle className="flex items-center justify-between">
                       <span>{t.transcription} ({currentLanguage.toUpperCase()})</span>
                       <Button size="sm" variant="ghost" onClick={handleTranslate} disabled={isTranslating}>
                           {isTranslating ? <Loader2 className="animate-spin" /> : <Languages className="mr-2" />}
                           {t.switchTo} {currentLanguage === 'en' ? 'ES' : 'EN'}
                       </Button>
                    </AlertTitle>
                    <AlertDescription className="h-48 overflow-y-auto whitespace-pre-wrap p-2 bg-muted/50 rounded-md">
                        {transcriptionText || (isTranslating ? 'Translating...' : t.noTranscription)}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownload('audio')}><FileAudio className="mr-2"/> {t.downloadAudio}</Button>
                <Button variant="outline" onClick={() => handleDownload('transcript')}><FileText className="mr-2"/> {t.downloadTranscript}</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive"><Trash2 className="mr-2"/> {t.delete}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t.deleteConfirmDescription}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteScribeEntry(recording.id)}>{t.continue}</AlertDialogAction>
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
    const [lang, setLang] = React.useState<'en' | 'es'>('en');

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
    
    const t = locale[lang];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setLang(lang === 'en' ? 'es' : 'en')}>
                    <Languages className="mr-2" /> {lang === 'en' ? 'Español' : 'English'}
                </Button>
            </div>
            <Recorder onNewRecording={handleNewRecording} lang={lang} disabled={isProcessing} />

            {isProcessing && (
                <Card className="flex items-center justify-center p-8">
                     <Loader2 className="h-8 w-8 animate-spin mr-4" />
                     <p>{t.processing}</p>
                </Card>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t.pastRecordings}</h3>
                {loading ? (
                     <Card className="flex items-center justify-center p-8">
                         <Loader2 className="h-8 w-8 animate-spin mr-4" />
                         <p>{t.loading}</p>
                    </Card>
                ) : scribeEntries.length > 0 ? (
                    scribeEntries.map(entry => <RecordingItem key={entry.id} recording={entry} lang={lang} />)
                ) : (
                    <Card className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">{t.noRecordings}</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
