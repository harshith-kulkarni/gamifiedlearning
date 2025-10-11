'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import type { GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions-from-pdf';
import { useGamification } from '@/contexts/gamification-context';
import { useAuth } from '@/contexts/auth-context';

type TaskInfo = {
    name: string;
    dataUri: string;
};

type QuizAnswer = {
    questionIndex: number;
    answer: string;
};

type CompletedSession = {
    id: string;
    taskName: string;
    points: number;
}

interface StudySessionContextType {
    taskInfo: TaskInfo | null;
    setTaskInfo: (info: TaskInfo | null) => void;
    
    quizQuestions: GenerateQuizQuestionsOutput['questions'] | null;
    setQuizQuestions: (questions: GenerateQuizQuestionsOutput['questions'] | null) => void;

    quizAnswers: QuizAnswer[];
    addQuizAnswer: (answer: QuizAnswer) => void;
    getAnswerForQuestion: (questionIndex: number) => string | undefined;

    coinsUsed: number;
    useCoin: () => boolean;

    studyDuration: number; 
    setStudyDuration: (duration: number) => void;

    penaltyPoints: number;
    addPenalty: (points: number) => void;

    completedSessions: CompletedSession[];
    addCompletedSession: (session: CompletedSession) => void;

    resetSession: () => void;
    
    // Prefetched data
    prefetchedQuizQuestions: GenerateQuizQuestionsOutput['questions'] | null;
    setPrefetchedQuizQuestions: (questions: GenerateQuizQuestionsOutput['questions'] | null) => void;

    // Timer state - persistent across tab switches
    timerState: {
        timeRemaining: number;
        isActive: boolean;
        isPaused: boolean;
        elapsedTime: number;
        sessionStartTime: Date | null;
    };
    updateTimerState: (updates: Partial<StudySessionContextType['timerState']>) => void;
    resetTimer: () => void;
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined);

export function StudySessionProvider({ children }: { children: ReactNode }) {
    const { user, getValidToken } = useAuth();
    const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<GenerateQuizQuestionsOutput['questions'] | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
    const [coinsUsed, setCoinsUsed] = useState(0);
    const [studyDuration, setStudyDuration] = useState(25 * 60); // Default to 25 mins in seconds
    const [penaltyPoints, setPenaltyPoints] = useState(0);
    const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
    const [prefetchedQuizQuestions, setPrefetchedQuizQuestions] = useState<GenerateQuizQuestionsOutput['questions'] | null>(null);
    
    // Timer state - persistent across component unmounts and tab switches
    const [timerState, setTimerState] = useState({
        timeRemaining: 25 * 60,
        isActive: false,
        isPaused: false,
        elapsedTime: 0,
        sessionStartTime: null as Date | null,
    });
    
    // Timer interval ref - persistent across renders
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Integrate with gamification system
    const { addPoints, incrementStreak, checkQuestProgress, powerUps, addStudyTime } = useGamification();

    // Load completed sessions from localStorage on initial client-side render
    useEffect(() => {
        try {
            const savedSessions = localStorage.getItem('completedSessions');
            if (savedSessions) {
                setCompletedSessions(JSON.parse(savedSessions));
            }
        } catch (error) {
            console.error('Failed to load sessions from localStorage', error);
        }
    }, []);

    // Save completed sessions to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
        } catch (error) {
            console.error('Failed to save sessions to localStorage', error);
        }
    }, [completedSessions]);

    // Global timer logic - runs independently of component visibility
    useEffect(() => {
        if (timerState.isActive && timerState.timeRemaining > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimerState((prev: typeof timerState) => {
                    const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
                    const newElapsedTime = studyDuration - newTimeRemaining;
                    return {
                        ...prev,
                        timeRemaining: newTimeRemaining,
                        elapsedTime: newElapsedTime,
                    };
                });
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [timerState.isActive, studyDuration]);


    const addQuizAnswer = useCallback((newAnswer: QuizAnswer) => {
        setQuizAnswers((prev: QuizAnswer[]) => {
            const existingIndex = prev.findIndex((a: QuizAnswer) => a.questionIndex === newAnswer.questionIndex);
            if (existingIndex > -1) {
                const updatedAnswers = [...prev];
                updatedAnswers[existingIndex] = newAnswer;
                return updatedAnswers;
            }
            return [...prev, newAnswer];
        });
    }, []);

    const getAnswerForQuestion = useCallback((questionIndex: number) => {
        return quizAnswers.find((a: QuizAnswer) => a.questionIndex === questionIndex)?.answer;
    }, [quizAnswers]);
    
    const useCoin = useCallback(() => {
        if (coinsUsed >= 3) {
            return false; // Cannot use more than 3 coins
        }
        setCoinsUsed((prev: number) => prev + 1);
        // Gamification: Answer reveal penalty
        addPoints(-10); // -10 points for revealing answer
        return true;
    }, [coinsUsed, addPoints]);
    
    const addPenalty = useCallback((points: number) => {
        setPenaltyPoints((prev: number) => prev + points);
        // Gamification: Penalties affect points
        addPoints(-points);
    }, [addPoints]);

    const addCompletedSession = useCallback(async (session: CompletedSession) => {
        if (!user) {
            console.warn('No user found, cannot save study session');
            return;
        }

        setCompletedSessions((prev: CompletedSession[]) => {
            // Avoid adding duplicates
            if (prev.find((s: CompletedSession) => s.id === session.id)) {
                return prev;
            }
            return [...prev, session]
        });
        
        // Calculate study time in minutes
        const studyTimeInMinutes = Math.floor(studyDuration / 60);
        
        // Save to database - but don't block the UI if it fails
        const saveToDatabase = async () => {
            try {
                const token = getValidToken();
                if (!token) {
                    console.warn('No valid auth token found, skipping database save');
                    return;
                }

                const sessionData = {
                    id: session.id,
                    taskName: session.taskName,
                    duration: studyTimeInMinutes, // Convert to minutes
                    score: 85, // Default score, should be calculated from quiz
                    points: session.points,
                    quizAnswers: quizAnswers.map((qa: QuizAnswer) => ({
                        questionIndex: qa.questionIndex,
                        answer: qa.answer,
                        correct: true // This should be calculated based on correct answers
                    }))
                };

                console.log('Attempting to save study session:', sessionData);

                const response = await fetch('/api/user/study-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(sessionData),
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    let errorMessage = 'Failed to save study session';
                    
                    try {
                        const errorObj = JSON.parse(errorData);
                        errorMessage = errorObj.error || errorMessage;
                    } catch (parseError) {
                        // If parsing fails, use the raw error data
                        errorMessage = errorData || errorMessage;
                    }
                    
                    console.error('Failed to save study session:', response.status, errorMessage);
                } else {
                    const result = await response.json();
                    console.log('Study session saved successfully:', result);
                }
            } catch (error) {
                console.error('Error saving study session:', error);
            }
        };

        // Save in background without blocking UI
        saveToDatabase();
        
        // Gamification: Add points for completing session
        // If session completed successfully then time in minutes * 5 points to be added
        const pointsEarned = studyTimeInMinutes * 5;
        addPoints(pointsEarned);
        
        // Update quest progress
        checkQuestProgress('quiz-5', 1);
        checkQuestProgress('study-60', studyTimeInMinutes); // Use actual minutes studied
        
        // Increment streak
        incrementStreak();
        
        // Add study time to total
        addStudyTime(studyTimeInMinutes);
    }, [user, studyDuration, quizAnswers, addPoints, checkQuestProgress, incrementStreak, addStudyTime]);

    // Sync timer duration with study duration
    useEffect(() => {
        if (!timerState.isActive && !timerState.isPaused) {
            setTimerState((prev: typeof timerState) => ({
                ...prev,
                timeRemaining: studyDuration,
                elapsedTime: 0,
            }));
        }
    }, [studyDuration, timerState.isActive, timerState.isPaused]);

    // Timer management functions
    const updateTimerState = useCallback((updates: Partial<typeof timerState>) => {
        setTimerState((prev: typeof timerState) => ({ ...prev, ...updates }));
    }, []);

    const resetTimer = useCallback(() => {
        setTimerState({
            timeRemaining: studyDuration,
            isActive: false,
            isPaused: false,
            elapsedTime: 0,
            sessionStartTime: null,
        });
    }, [studyDuration]);

    const resetSession = useCallback(() => {
        setTaskInfo(null);
        setQuizQuestions(null);
        setQuizAnswers([]);
        setCoinsUsed(0);
        setStudyDuration(25 * 60);
        resetTimer();
        setPenaltyPoints(0);
        setPrefetchedQuizQuestions(null);
    }, [])

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        taskInfo, setTaskInfo,
        quizQuestions, setQuizQuestions,
        quizAnswers, addQuizAnswer, getAnswerForQuestion,
        coinsUsed, useCoin,
        studyDuration, setStudyDuration,
        penaltyPoints, addPenalty,
        completedSessions, addCompletedSession,
        resetSession,
        prefetchedQuizQuestions, setPrefetchedQuizQuestions,
        timerState, updateTimerState, resetTimer
    }), [
        taskInfo, quizQuestions, quizAnswers, coinsUsed, studyDuration, 
        penaltyPoints, completedSessions, resetSession, prefetchedQuizQuestions,
        addQuizAnswer, getAnswerForQuestion, useCoin, addPenalty, 
        addCompletedSession, setPrefetchedQuizQuestions, timerState, updateTimerState, resetTimer
    ]);

    return <StudySessionContext.Provider value={value}>{children}</StudySessionContext.Provider>;
}

export function useStudySession() {
    const context = useContext(StudySessionContext);
    if (context === undefined) {
        throw new Error('useStudySession must be used within a StudySessionProvider');
    }
    return context;
}