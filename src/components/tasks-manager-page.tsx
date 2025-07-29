'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTasksAnalysis } from '@/ai/flows/get-tasks-analysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTasks } from '@/contexts/task-context';

export function TasksManagerPage() {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const { toast } = useToast();
  const { tasks } = useTasks();

  const handleAnalyzeTasks = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await getTasksAnalysis({
        tasks: JSON.stringify(tasks),
        currentDate: new Date().toISOString().split('T')[0],
      });
      setAnalysis(response);
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
          <Button onClick={handleAnalyzeTasks} disabled={loading || tasks.length === 0} className="w-full">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {loading ? 'Analyzing...' : 'Generate Task Analysis'}
          </Button>

          {analysis && (
            <div className="mt-6 space-y-4">
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
