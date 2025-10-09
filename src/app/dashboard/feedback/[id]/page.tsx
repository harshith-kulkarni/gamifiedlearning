'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudySession } from '@/contexts/study-session-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowRight, TrendingUp, Target, Star, Clock, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { analyzeQuizPerformance, type AnalyzeQuizPerformanceOutput } from '@/ai/flows/analyze-quiz-performance';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeedbackPage() {
    const router = useRouter();
    const params = useParams();
    const { taskInfo, quizQuestions, quizAnswers, coinsUsed, studyDuration, penaltyPoints, resetSession, addCompletedSession } = useStudySession();
    const [isClient, setIsClient] = useState(false);
    const [analysis, setAnalysis] = useState<AnalyzeQuizPerformanceOutput | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && quizQuestions && taskInfo) {
            const performAnalysis = async () => {
                setIsAnalyzing(true);
                try {
                    const result = await analyzeQuizPerformance({
                        pdfDataUri: taskInfo.dataUri,
                        questions: quizQuestions,
                        userAnswers: quizAnswers,
                    });
                    setAnalysis(result);
                } catch (error) {
                    console.error("Failed to analyze performance:", error);
                    // Set fallback data so the page is still useful
                    setAnalysis({
                        strengths: ["Could not analyze strengths. Please review your answers manually."],
                        weaknesses: ["Could not analyze weaknesses. Please review your answers manually."]
                    });
                } finally {
                    setIsAnalyzing(false);
                }
            };
            performAnalysis();
        }
    }, [isClient, quizQuestions, quizAnswers, taskInfo]);

    const score = useMemo(() => {
        if (!quizQuestions) return 0;
        return quizAnswers.reduce((correctAnswers, userAnswer) => {
            const question = quizQuestions[userAnswer.questionIndex];
            if (question && question.answer === userAnswer.answer) {
                return correctAnswers + 1;
            }
            return correctAnswers;
        }, 0);
    }, [quizQuestions, quizAnswers]);
    
    const points = useMemo(() => {
        const studyPoints = Math.floor(studyDuration / 3600) * 2; // 2 points per hour studied
        const quizPoints = score * 4; // 4 points per correct answer
        const coinPenalty = coinsUsed * 25; // 25 points penalty per coin used
        return studyPoints + quizPoints - coinPenalty - penaltyPoints;
    }, [studyDuration, score, coinsUsed, penaltyPoints]);

    useEffect(() => {
        if(taskInfo && params.id) {
            addCompletedSession({
                id: params.id as string,
                taskName: taskInfo.name,
                points: points
            })
        }
    }, [taskInfo, params.id, points, addCompletedSession])

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`;
    };

    const handleDone = () => {
        resetSession();
        router.push('/dashboard');
    };

    if (!isClient || !quizQuestions) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Calculating your results...</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">Session Complete!</CardTitle>
                    <CardDescription>Here's a summary of your study session for '{taskInfo?.name || 'your task'}'</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center justify-center gap-2 text-base font-medium"><Clock className="h-4 w-4"/>Study Time</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{formatDuration(studyDuration)}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="flex items-center justify-center gap-2 text-base font-medium"><CheckCircle className="h-4 w-4"/>Quiz Score</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{score} / {quizQuestions.length}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="flex items-center justify-center gap-2 text-base font-medium"><Star className="h-4 w-4"/>Points Earned</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold text-accent">{points > 0 ? `+${points}`: points}</p></CardContent>
                        </Card>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/>Strengths Identified</h3>
                            {isAnalyzing ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-4/5" />
                                    <Skeleton className="h-4 w-3/5" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            ) : (
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                    {analysis?.strengths.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            )}
                        </div>
                         <div className="space-y-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-destructive"/>Areas for Improvement</h3>
                             {isAnalyzing ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-4/5" />
                                    <Skeleton className="h-4 w-3/5" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            ) : (
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                    {analysis?.weaknesses.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>

                     <div className="text-center pt-6">
                        <Button onClick={handleDone} size="lg" className="bg-accent hover:bg-accent/90">
                           Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
