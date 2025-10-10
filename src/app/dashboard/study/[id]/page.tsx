'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudySession } from '@/contexts/study-session-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudyTimer } from '@/components/study/study-timer';
import { Logo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Resizable } from '@/components/ui/resizable';

// Lazy load the AI chat component
import { lazy, useRef } from 'react';

const AIChat = lazy(() => import('@/components/study/ai-chat').then(module => ({ default: module.AIChat })));

export default function StudyPage() {
    const router = useRouter();
    const params = useParams();
    const { taskInfo, setTaskInfo, setStudyDuration, addPenalty } = useStudySession();
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const embedRef = useRef<HTMLObjectElement>(null);

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
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-8">
            <div className="flex flex-1 gap-8 min-h-0">
                <Resizable 
                    initialWidth={50} 
                    minWidth={30} 
                    maxWidth={70}
                    className="transition-all duration-300 hover:shadow-lg rounded-lg group h-full"
                >
                    <div className="flex flex-col h-full gap-8">
                        <Card className="transition-all duration-300 group-hover:shadow-md hover:shadow-lg flex-shrink-0">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Current Document</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl font-bold truncate">{taskInfo.name}</p>
                                <p className="text-xs text-muted-foreground">Your uploaded document is displayed here.</p>
                            </CardContent>
                        </Card>
                        <Card className="flex-1 transition-all duration-300 group-hover:shadow-md hover:shadow-lg flex-shrink-0">
                            <CardContent className="h-full p-0 relative rounded-b-lg">
                                {taskInfo.dataUri ? (
                                    <>
                                        <object 
                                            ref={embedRef}
                                            data={taskInfo.dataUri} 
                                            type="application/pdf" 
                                            className="h-full w-full rounded-b-lg"
                                        >
                                            <p>PDF viewer is not available. You can download the PDF <a href={taskInfo.dataUri} download>here</a>.</p>
                                        </object>
                                        <div className="absolute inset-0 rounded-b-lg bg-gradient-to-b from-transparent to-background/30 pointer-events-none group-hover:opacity-0 transition-opacity duration-300"></div>
                                        {/* Padding at the bottom of PDF viewer */}
                                        <div className="h-4 w-full bg-background"></div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">Loading document...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </Resizable>
                
                <div className="flex flex-col gap-8 flex-1 min-w-0 h-full">
                    <StudyTimer 
                        onComplete={handleSessionComplete} 
                        onEarlyFinish={() => {
                            // This function is passed to the timer but the trigger is inside an alert dialog
                            // So we need to wrap the button in the dialog trigger
                        }}
                    >
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="transition-all duration-300 hover:scale-105 hover:shadow-lg flex-shrink-0">End Session Early</Button>
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
                    <div className="flex-1 min-h-0">
                        <Suspense fallback={
                            <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-md">
                                <CardHeader className="flex flex-row items-center">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-5 rounded-full" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4 p-0">
                                    <div className="flex-1 p-4">
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex items-end gap-2 justify-start">
                                                    <Skeleton className="h-8 w-8 rounded-full" />
                                                    <Skeleton className="h-12 w-4/5 rounded-lg" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t bg-background/50">
                                        <div className="flex gap-2">
                                            <Skeleton className="h-10 flex-1" />
                                            <Skeleton className="h-10 w-10" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        }>
                            <AIChat pdfDataUri={taskInfo.dataUri} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}