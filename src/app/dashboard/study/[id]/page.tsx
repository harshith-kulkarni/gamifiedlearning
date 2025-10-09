'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudySession } from '@/contexts/study-session-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudyTimer } from '@/components/study/study-timer';
import { AIChat } from '@/components/study/ai-chat';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';


export default function StudyPage() {
    const router = useRouter();
    const params = useParams();
    const { taskInfo, setTaskInfo, setStudyDuration, addPenalty } = useStudySession();
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        if (!taskInfo) {
            const storedData = sessionStorage.getItem(`task-${params.id}`);
            if (storedData) {
                try {
                    const parsedData = JSON.parse(storedData);
                    setTaskInfo(parsedData.taskInfo);
                    setStudyDuration(parsedData.studyDuration);
                } catch(e) {
                     setError("Failed to load session data. Please start a new task.");
                }
            } else {
                // If there's no session data, it could be a refresh.
                // We shouldn't immediately redirect, but let other components handle it
                // if they rely on taskInfo and it's not there.
            }
        }
    }, []);
    
    useEffect(() => {
        if(taskInfo){
             sessionStorage.setItem(`task-${params.id}`, JSON.stringify(taskInfo));
        }
    }, [taskInfo, params.id])

    useEffect(() => {
        if(error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error,
            });
            router.replace('/dashboard/create-task');
        }
    }, [error, router, toast]);
    
    const handleSessionComplete = (duration: number) => {
        setStudyDuration(duration);
        toast({
            title: "Time's up!",
            description: "Let's see what you've learned. Moving to the quiz...",
        });
        router.push(`/dashboard/quiz/${params.id}`);
    };

    const handleEarlyFinish = () => {
        addPenalty(25); // 25 point penalty for ending session early
        toast({
            title: 'Session Ended Early',
            description: 'A 25 point penalty has been applied. Moving to quiz...',
            variant: 'destructive'
        });
        router.push(`/dashboard/quiz/${params.id}`);
    }

    if (!isClient) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if(!taskInfo){
         return (
            <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
                <p className="text-muted-foreground">Session data not found. Please start a new session.</p>
                <Button onClick={() => router.push('/dashboard/create-task')}>Create New Task</Button>
            </div>
        );
    }
    
    return (
        <div className="grid md:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Current Document</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold truncate">{taskInfo.name}</p>
                        <p className="text-xs text-muted-foreground">Your uploaded document is displayed here.</p>
                    </CardContent>
                </Card>
                <Card className="flex-1">
                    <CardContent className="h-full p-0">
                         <embed src={taskInfo.dataUri} type="application/pdf" className="h-full w-full"/>
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col gap-8">
                <StudyTimer 
                    onComplete={handleSessionComplete} 
                    onEarlyFinish={() => {
                        // This function is passed to the timer but the trigger is inside an alert dialog
                        // So we need to wrap the button in the dialog trigger
                    }}
                >
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive">End Session Early</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>End Session Early?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ending the session early will incur a 50-point penalty. Are you sure you want to proceed to the quiz?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleEarlyFinish} className="bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </StudyTimer>
                <AIChat pdfDataUri={taskInfo.dataUri} />
            </div>
        </div>
    );
}
