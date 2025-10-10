'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudySession } from '@/contexts/study-session-context';
import { useGamification } from '@/contexts/gamification-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, AlertTriangle, Zap, Star, Target, Trophy, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudyTimer } from '@/components/study/study-timer';
import { Logo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Resizable } from '@/components/ui/resizable';
import { PowerUpActivator } from '@/components/gamification/power-up-activator';

// Lazy load the AI chat component
import { lazy, useRef } from 'react';

const AIChat = lazy(() => import('@/components/study/ai-chat').then(module => ({ default: module.AIChat })));

export default function StudyPage() {
    const router = useRouter();
    const params = useParams();
    const { taskInfo, setTaskInfo, setStudyDuration, addPenalty, coinsUsed, penaltyPoints } = useStudySession();
    const { points, level, streak, badges, powerUps, quests, challenges, dailyGoal, dailyProgress, addPoints, activatePowerUp } = useGamification();
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
    
    const handleSessionComplete = useCallback((duration: number) => {
        setStudyDuration(duration);
        // Gamification: Update daily progress
        const minutesStudied = Math.floor(duration / 60);
        // Add points for studying (2 points per minute)
        addPoints(minutesStudied * 2);
        
        toast({
            title: "Time's up! 🎉",
            description: "Great job! Let's see what you've learned. Moving to the quiz...",
            className: "animate-levelUp"
        });
        router.push(`/dashboard/quiz/${params.id}`);
    }, [setStudyDuration, addPoints, router, params.id, toast]);

    const handleEarlyFinish = useCallback(() => {
        addPenalty(25); // 25 point penalty for ending session early
        toast({
            title: 'Session Ended Early ⚠️',
            description: 'A 25 point penalty has been applied. Moving to quiz...',
            variant: 'destructive',
            className: "animate-shake"
        });
        router.push(`/dashboard/quiz/${params.id}`);
    }, [addPenalty, router, params.id, toast]);

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
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-8 animate-fadeIn">
            {/* Gamification Header */}
            <div className="flex flex-wrap justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl animate-gradientShift gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-black/20 px-4 py-2 rounded-full shadow-md">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-bold">Study Session</span>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{points} Points</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
                        <Flame className="h-5 w-5 text-red-500" />
                        <span className="font-bold">{streak} Day Streak</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                        <Trophy className="h-5 w-5 text-blue-500" />
                        <span className="font-bold">Level {level}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full">
                        <Zap className="h-5 w-5 text-purple-500" />
                        <span className="font-bold">{coinsUsed} Coins</span>
                    </div>
                    <PowerUpActivator />
                    {penaltyPoints > 0 && (
                        <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span className="font-bold">{penaltyPoints} Penalties</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex flex-1 gap-8 min-h-0">
                <Resizable 
                    initialWidth={50} 
                    minWidth={30} 
                    maxWidth={70}
                    className="transition-all duration-300 hover:shadow-xl rounded-xl group h-full gamify-card"
                >
                    <div className="flex flex-col h-full gap-8">
                        <Card className="transition-all duration-300 group-hover:shadow-lg hover:shadow-xl flex-shrink-0 gamify-card rounded-xl overflow-hidden border-2 border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-primary/10 to-accent/10">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Current Document
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-xs text-muted-foreground">Active</span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-3">
                                <p className="text-xl font-bold truncate">{taskInfo.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">Your uploaded document is displayed here.</p>
                            </CardContent>
                        </Card>
                        <Card className="flex-1 transition-all duration-300 group-hover:shadow-lg hover:shadow-xl flex-shrink-0 gamify-card rounded-xl overflow-hidden border-2 border-primary/20">
                            <CardContent className="h-full p-0 relative rounded-b-xl bg-gradient-to-b from-background to-muted/20">
                                {taskInfo.dataUri ? (
                                    <>
                                        <object 
                                            ref={embedRef}
                                            data={taskInfo.dataUri} 
                                            type="application/pdf" 
                                            className="h-full w-full rounded-b-xl"
                                        >
                                            <p>PDF viewer is not available. You can download the PDF <a href={taskInfo.dataUri} download>here</a>.</p>
                                        </object>
                                        <div className="absolute inset-0 rounded-b-xl bg-gradient-to-b from-transparent to-background/30 pointer-events-none group-hover:opacity-0 transition-opacity duration-300"></div>
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
                                <Button variant="destructive" className="gamify-button transition-all duration-300 hover:scale-105 hover:shadow-xl flex-shrink-0 rounded-full px-6 py-3 font-bold text-lg animate-pulseGlow">
                                    End Session Early
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-6 w-6 text-destructive" />
                                        End Session Early?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Ending the session early will incur a 50-point penalty. Are you sure you want to proceed to the quiz?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleEarlyFinish} 
                                        className="bg-destructive hover:bg-destructive/90 rounded-full animate-shake"
                                    >
                                        Confirm
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </StudyTimer>
                    <div className="flex-1 min-h-0">
                        <Suspense fallback={
                            <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl gamify-card rounded-xl overflow-hidden border-2 border-primary/20">
                                <CardHeader className="flex flex-row items-center bg-gradient-to-r from-primary/10 to-accent/10">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                        <Skeleton className="h-6 w-32" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4 p-0">
                                    <div className="flex-1 p-4">
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex items-end gap-2 justify-start">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <Skeleton className="h-16 w-4/5 rounded-2xl" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t bg-background/50">
                                        <div className="flex gap-2">
                                            <Skeleton className="h-12 flex-1 rounded-full" />
                                            <Skeleton className="h-12 w-12 rounded-full" />
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