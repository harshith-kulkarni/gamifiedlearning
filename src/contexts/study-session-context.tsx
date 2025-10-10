'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
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
    useCoin: () => void;

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
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined);

export function StudySessionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<GenerateQuizQuestionsOutput['questions'] | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
    const [coinsUsed, setCoinsUsed] = useState(0);
    const [studyDuration, setStudyDuration] = useState(25 * 60); // Default to 25 mins in seconds
    const [penaltyPoints, setPenaltyPoints] = useState(0);
    const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
    const [prefetchedQuizQuestions, setPrefetchedQuizQuestions] = useState<GenerateQuizQuestionsOutput['questions'] | null>(null);
    
    // Integrate with gamification system
    const { addPoints, incrementStreak, checkQuestProgress } = useGamification();

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


    const addQuizAnswer = useCallback((newAnswer: QuizAnswer) => {
        setQuizAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionIndex === newAnswer.questionIndex);
            if (existingIndex > -1) {
                const updatedAnswers = [...prev];
                updatedAnswers[existingIndex] = newAnswer;
                return updatedAnswers;
            }
            return [...prev, newAnswer];
        });
    }, []);

    const getAnswerForQuestion = useCallback((questionIndex: number) => {
        return quizAnswers.find(a => a.questionIndex === questionIndex)?.answer;
    }, [quizAnswers]);
    
    const useCoin = useCallback(() => {
        setCoinsUsed(prev => prev + 1);
        // Gamification: Using coins affects points
        addPoints(-5); // Small penalty for using coins
    }, [addPoints]);
    
    const addPenalty = useCallback((points: number) => {
        setPenaltyPoints(prev => prev + points);
        // Gamification: Penalties affect points
        addPoints(-points);
    }, [addPoints]);

    const addCompletedSession = useCallback(async (session: CompletedSession) => {
        if (!user) return;

        setCompletedSessions(prev => {
            // Avoid adding duplicates
            if (prev.find(s => s.id === session.id)) {
                return prev;
            }
            return [...prev, session]
        });
        
        // Save to database
        try {
            const token = localStorage.getItem('auth-token');
            if (token) {
                const response = await fetch('/api/user/study-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        id: session.id,
                        taskName: session.taskName,
                        duration: Math.floor(studyDuration / 60), // Convert to minutes
                        score: 85, // Default score, should be calculated from quiz
                        points: session.points,
                        quizAnswers: quizAnswers.map(qa => ({
                            ...qa,
                            correct: true // This should be calculated based on correct answers
                        }))
                    }),
                });

                if (!response.ok) {
                    console.error('Failed to save study session');
                }
            }
        } catch (error) {
            console.error('Error saving study session:', error);
        }
        
        // Gamification: Add points for completing session
        addPoints(session.points);
        
        // Update quest progress
        checkQuestProgress('quiz-5', 1);
        checkQuestProgress('study-60', session.points / 4); // Assuming 4 points per minute
        
        // Increment streak
        incrementStreak();
    }, [user, studyDuration, quizAnswers, addPoints, checkQuestProgress, incrementStreak]);

    const resetSession = useCallback(() => {
        setTaskInfo(null);
        setQuizQuestions(null);
        setQuizAnswers([]);
        setCoinsUsed(0);
        setStudyDuration(25 * 60);
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
        prefetchedQuizQuestions, setPrefetchedQuizQuestions
    }), [
        taskInfo, quizQuestions, quizAnswers, coinsUsed, studyDuration, 
        penaltyPoints, completedSessions, resetSession, prefetchedQuizQuestions,
        addQuizAnswer, getAnswerForQuestion, useCoin, addPenalty, 
        addCompletedSession, setPrefetchedQuizQuestions
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