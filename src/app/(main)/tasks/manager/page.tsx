'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle, ListTodo, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTasksAnalysis } from '@/ai/flows/get-tasks-analysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTasks } from '@/contexts/task-context';

function TasksManagerPageComponent() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { tasks, loading: tasksLoading } = useTasks();

  const hasData = tasks.length > 0;
  const isDataLoading = tasksLoading;

  const handleAnalyzeTasks = async () => {
    setLoading(true);
    setAnalysis(null);
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    
    try {
      const response = await getTasksAnalysis({
        tasks: JSON.stringify(tasks),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
      if (response.audioDataUri) {
          audioRef.current = new Audio(response.audioDataUri);
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
          audioRef.current.onended = () => setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error analyzing tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Failed to connect to the task analysis AI.',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Task Manager</CardTitle>
          <CardDescription>
            Get a high-level analysis of your current tasks, including priorities, potential risks, and strategic recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyzeTasks} disabled={loading || isDataLoading || !hasData} className="w-full">
            {loading || isDataLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : (isDataLoading ? 'Loading Tasks...' : 'Generate Task Analysis')}
          </Button>

          {!isDataLoading && !hasData && (
             <Alert className="mt-4">
                  <ListTodo className="h-4 w-4" />
                  <AlertTitle>No Tasks to Analyze</AlertTitle>
                  <AlertDescription>
                      You have no tasks in your list. Please add a task first to get suggestions.
                      <div className="mt-2">
                        <Button variant="link" asChild><Link href="/tasks">Go to Tasks</Link></Button>
                      </div>
                  </AlertDescription>
              </Alert>
          )}

          {analysis && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-end">
                <Button onClick={togglePlayback} disabled={!analysis.audioDataUri || loading}>
                  {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                  {isPlaying ? 'Pause' : 'Play Analysis'}
                </Button>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Overall Summary</AlertTitle>
                <AlertDescription>
                  {analysis.summary}
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Priority Task</AlertTitle>
                <AlertDescription>
                  <p className="font-semibold">{analysis.priorityTask.title}</p>
                  <p>{analysis.priorityTask.reasoning}</p>
                </AlertDescription>
              </Alert>

              {analysis.risk.hasRisk && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Potential Risk Detected</AlertTitle>
                    <AlertDescription>
                       <p>{analysis.risk.description}</p>
                    </AlertDescription>
                </Alert>
              )}

               <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Suggestions</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        {analysis.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                 </CardContent>
               </Card>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TasksManagerPage() {
  return <TasksManagerPageComponent />;
}
