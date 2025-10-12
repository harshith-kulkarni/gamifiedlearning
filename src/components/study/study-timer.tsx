'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useStudySession } from '@/contexts/study-session-context';
import { useGamification } from '@/contexts/gamification-context';
import { useToast } from '@/hooks/use-toast';

interface StudyTimerProps {
    onComplete?: (elapsedSeconds: number) => void;
    onEarlyFinish?: () => void;
    children?: ReactNode;
}

export function StudyTimer({ onComplete, onEarlyFinish, children }: StudyTimerProps) {
    const { studyDuration, setStudyDuration } = useStudySession();
    const { addStudyTime, addPoints } = useGamification();
    const { toast } = useToast();
    
    const initialTime = useRef(studyDuration);
    const [time, setTime] = useState(studyDuration);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const startTimeRef = useRef<Date | null>(null);

    useEffect(() => {
        // If the context duration changes, reset the timer
        if (studyDuration !== initialTime.current && !isActive && !isPaused) {
            initialTime.current = studyDuration;
            setTime(studyDuration);
            setElapsedTime(0);
        }
    }, [studyDuration, isActive, isPaused]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => {
                    const newTime = prevTime - 1;
                    setElapsedTime(initialTime.current - newTime);
                    return newTime;
                });
            }, 1000);
        } else if (time === 0 && isActive) {
            // Timer completed
            setIsActive(false);
            const totalElapsed = initialTime.current;
            const minutesStudied = Math.floor(totalElapsed / 60);
            
            // Award points for completing timer
            const pointsEarned = minutesStudied * 2; // 2 points per minute
            addPoints(pointsEarned);
            addStudyTime(minutesStudied);
            
            // Save session to database
            const saveSession = async () => {
                try {
                    const token = localStorage.getItem('auth-token');
                    if (token) {
                        const sessionData = {
                            id: `timer_session_${Date.now()}`,
                            taskName: 'Study Timer Session',
                            duration: minutesStudied,
                            score: 100, // Full score for completing timer
                            points: pointsEarned,
                        };

                        const response = await fetch('/api/user/study-session', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify(sessionData),
                        });

                        if (response.ok) {
                            // Timer session saved successfully
                        }
                    }
                } catch (error) {
                    console.error('Error saving timer session:', error);
                }
            };

            saveSession();
            
            toast({
                title: "Study Session Complete! 🎉",
                description: `You studied for ${minutesStudied} minutes and earned ${pointsEarned} points!`,
            });
            
            if (onComplete) {
                onComplete(totalElapsed);
            }
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time, onComplete, addPoints, addStudyTime, toast]);

    const handleStart = () => {
        if (!isActive && !isPaused) {
            startTimeRef.current = new Date();
            setIsActive(true);
            setIsPaused(false);
            
            toast({
                title: "Study Session Started! 📚",
                description: "Focus mode activated. Good luck!",
            });
        }
    };

    const handlePause = () => {
        if (isActive) {
            setIsActive(false);
            setIsPaused(true);
            
            toast({
                title: "Study Session Paused ⏸️",
                description: "Take a break! Click play to continue.",
            });
        }
    };

    const handleResume = () => {
        if (isPaused) {
            setIsActive(true);
            setIsPaused(false);
            
            toast({
                title: "Study Session Resumed ▶️",
                description: "Back to studying! Keep up the great work!",
            });
        }
    };

    const handleStop = () => {
        if (isActive || isPaused) {
            setIsActive(false);
            setIsPaused(false);
            
            const minutesStudied = Math.floor(elapsedTime / 60);
            // Award partial points for early finish
            const partialPoints = minutesStudied * 1.5; // 1.5 points per minute for early finish
            
            if (partialPoints > 0) {
                addPoints(partialPoints);
                addStudyTime(minutesStudied);
                
                // Save partial session to database
                const savePartialSession = async () => {
                    try {
                        const token = localStorage.getItem('auth-token');
                        if (token) {
                            const sessionData = {
                                id: `timer_partial_${Date.now()}`,
                                taskName: 'Study Timer Session (Early End)',
                                duration: minutesStudied,
                                score: Math.floor((elapsedTime / initialTime.current) * 100), // Partial score
                                points: Math.floor(partialPoints),
                            };

                            const response = await fetch('/api/user/study-session', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify(sessionData),
                            });

                            if (response.ok) {
                                // Partial timer session saved successfully
                            }
                        }
                    } catch (error) {
                        console.error('Error saving partial timer session:', error);
                    }
                };

                savePartialSession();
                
                toast({
                    title: "Study Session Ended Early 🛑",
                    description: `You studied for ${minutesStudied} minutes and earned ${Math.floor(partialPoints)} points!`,
                });
            }
            
            if (onEarlyFinish) {
                onEarlyFinish();
            }
        }
    };

    const handleReset = () => {
        setIsActive(false);
        setIsPaused(false);
        setTime(initialTime.current);
        setElapsedTime(0);
        startTimeRef.current = null;
        
        toast({
            title: "Timer Reset 🔄",
            description: "Timer has been reset to the original duration.",
        });
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        return ((initialTime.current - time) / initialTime.current) * 100;
    };

    const getTimerColor = () => {
        const percentage = getProgressPercentage();
        if (percentage < 25) return 'text-green-600';
        if (percentage < 50) return 'text-blue-600';
        if (percentage < 75) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Study Timer</CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Timer Display */}
                <div className="text-center space-y-2">
                    <div className={`text-5xl font-bold font-mono ${getTimerColor()}`}>
                        {formatTime(time)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {elapsedTime > 0 && (
                            <span>Elapsed: {formatTime(elapsedTime)}</span>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-primary h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center gap-2">
                    {!isActive && !isPaused && (
                        <Button 
                            onClick={handleStart}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Play className="h-4 w-4" />
                            Start
                        </Button>
                    )}
                    
                    {isActive && (
                        <Button 
                            onClick={handlePause}
                            variant="outline"
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Pause className="h-4 w-4" />
                            Pause
                        </Button>
                    )}
                    
                    {isPaused && (
                        <Button 
                            onClick={handleResume}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Play className="h-4 w-4" />
                            Resume
                        </Button>
                    )}
                    
                    {(isActive || isPaused) && (
                        <Button 
                            onClick={handleStop}
                            variant="destructive"
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Square className="h-4 w-4" />
                            Stop
                        </Button>
                    )}
                    
                    <Button 
                        onClick={handleReset}
                        variant="ghost"
                        className="flex items-center gap-2"
                        size="sm"
                        disabled={isActive}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </Button>
                </div>

                {/* Timer Settings */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <div className="flex gap-2">
                        {[15, 25, 45, 60, 90].map(minutes => (
                            <Button
                                key={minutes}
                                variant={studyDuration === minutes * 60 ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    if (!isActive) {
                                        const newDuration = minutes * 60;
                                        setStudyDuration(newDuration);
                                        initialTime.current = newDuration;
                                        setTime(newDuration);
                                        setElapsedTime(0);
                                    }
                                }}
                                disabled={isActive}
                            >
                                {minutes}m
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Status Display */}
                <div className="text-center text-sm text-muted-foreground">
                    {isActive && "🔥 Study session in progress..."}
                    {isPaused && "⏸️ Study session paused"}
                    {!isActive && !isPaused && "⏰ Ready to start studying"}
                </div>

                {children}
            </CardContent>
        </Card>
    );
}
