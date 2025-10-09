'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause } from 'lucide-react';
import { useStudySession } from '@/contexts/study-session-context';

interface StudyTimerProps {
    onComplete: (elapsedSeconds: number) => void;
    onEarlyFinish: () => void;
    children: ReactNode;
}

export function StudyTimer({ onComplete, onEarlyFinish, children }: StudyTimerProps) {
    const { studyDuration } = useStudySession();
    const initialTime = useRef(studyDuration);
    const [time, setTime] = useState(initialTime.current);
    const [isActive, setIsActive] = useState(false);

     useEffect(() => {
        // If the context duration changes (e.g. on creation page), reset the timer
        if(studyDuration !== initialTime.current) {
            initialTime.current = studyDuration;
            setTime(studyDuration);
        }
    }, [studyDuration]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            setIsActive(false);
            onComplete(initialTime.current);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time, onComplete]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Study Timer</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold text-center font-mono">{formatTime(time)}</div>
                <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="icon" onClick={() => setIsActive(!isActive)} aria-label={isActive ? 'Pause timer' : 'Start timer'}>
                        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    {children}
                </div>
            </CardContent>
        </Card>
    );
}
