'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudySession } from '@/contexts/study-session-context';
import { useGamification } from '@/contexts/gamification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, ArrowRight, Lightbulb, Coins, Trophy, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQuizQuestions, type GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions-from-pdf';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function QuizPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { taskInfo, setQuizQuestions: setContextQuizQuestions, quizQuestions, addQuizAnswer, getAnswerForQuestion, useCoin, coinsUsed } = useStudySession();
    const { points, addPoints, completeChallenge, checkQuestProgress } = useGamification();

    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!taskInfo?.dataUri) {
            toast({
                variant: 'destructive',
                title: 'Session Error',
                description: 'No document found. Redirecting to create a new task.',
            });
            router.replace('/dashboard/create-task');
            return;
        }

        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const result = await generateQuizQuestions({ pdfDataUri: taskInfo.dataUri! });
                setContextQuizQuestions(result.questions);
            } catch (error) {
                console.error("Failed to generate quiz questions:", error);
                toast({
                    variant: 'destructive',
                    title: 'Quiz Generation Failed',
                    description: 'Could not generate questions. Please try again.',
                });
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        if (!quizQuestions || quizQuestions.length === 0) {
            fetchQuestions();
        } else {
            setIsLoading(false);
        }
    }, [taskInfo, router, toast, setContextQuizQuestions, quizQuestions]);

    const currentQuestion = useMemo(() => quizQuestions?.[currentQuestionIndex], [quizQuestions, currentQuestionIndex]);
    const selectedAnswer = useMemo(() => getAnswerForQuestion(currentQuestionIndex), [currentQuestionIndex, getAnswerForQuestion]);

    const handleNext = useCallback(() => {
        // Check if answer is correct before moving to next question
        if (currentQuestion && selectedAnswer) {
            if (selectedAnswer === currentQuestion.answer) {
                setScore(prev => prev + 1);
                addPoints(4); // 4 points per correct answer
            }
        }
        
        if (quizQuestions && currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (quizQuestions) {
            // Quiz completed - check for challenges
            const finalScore = selectedAnswer === currentQuestion?.answer ? score + 1 : score;
            const percentage = (finalScore / quizQuestions.length) * 100;
            
            // Check for perfect score challenge
            if (percentage === 100) {
                completeChallenge('perfect-score');
            }
            
            // Update quest progress
            checkQuestProgress('quiz-5', 1);
            
            router.push(`/dashboard/feedback/${params.id}`);
        }
    }, [currentQuestion, selectedAnswer, currentQuestionIndex, quizQuestions, score, router, params.id, addPoints, completeChallenge, checkQuestProgress]);

    const handlePrev = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const handleRevealAnswer = useCallback(() => {
        useCoin();
        // Apply 25 point penalty when using a coin
        addPoints(-25);
        setRevealedAnswers(prev => [...prev, currentQuestionIndex]);
        
        // Gamification: Check for hint revealer power-up
        toast({
            title: "Answer Revealed",
            description: "The correct answer is now highlighted.",
        });
    }, [useCoin, addPoints, currentQuestionIndex, toast]);

    const isAnswerRevealed = useMemo(() => revealedAnswers.includes(currentQuestionIndex), [revealedAnswers, currentQuestionIndex]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Generating your quiz...</p>
            </div>
        );
    }

    if (!quizQuestions || quizQuestions.length === 0) {
        return (
             <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
                <p className="text-muted-foreground">Failed to load quiz questions. Please try again.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
        <div className="container mx-auto max-w-2xl py-8">
            {/* Gamification Header */}
            <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-sm">{points} Points</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                        <Trophy className="h-4 w-4 text-blue-500" />
                        <span className="font-bold text-sm">Score: {score}/{quizQuestions.length}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                    <Coins className="h-4 w-4 text-purple-500" />
                    <span className="font-bold text-sm">{coinsUsed} Coins Used</span>
                </div>
            </div>
            
            <Card className="shadow-lg gamify-card">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Quiz Time: {taskInfo?.name}</CardTitle>
                    <CardDescription>Test your knowledge. Let's see what you've learned!</CardDescription>
                    <div className="flex items-center gap-4 pt-2">
                        <Progress value={progress} className="w-full" />
                        <span className="text-sm font-medium text-muted-foreground">{currentQuestionIndex + 1} / {quizQuestions.length}</span>
                    </div>
                </CardHeader>
                <CardContent className="min-h-[20rem] space-y-6">
                    <h2 className="text-lg font-semibold">{currentQuestion?.question}</h2>
                    <RadioGroup
                        value={selectedAnswer}
                        onValueChange={(value) => addQuizAnswer({ questionIndex: currentQuestionIndex, answer: value })}
                        className="space-y-2"
                        disabled={isAnswerRevealed}
                    >
                        {currentQuestion?.options.map((option, i) => {
                             const isCorrect = option === currentQuestion.answer;
                             const isSelected = selectedAnswer === option;
                            return (
                                <div key={i} className={cn(
                                    "flex items-center space-x-2 rounded-md border p-4 transition-all",
                                    isAnswerRevealed && isCorrect ? 'border-green-500 bg-green-500/10' : '',
                                    isAnswerRevealed && !isCorrect && isSelected ? 'border-destructive bg-destructive/10' : ''
                                    )}>
                                    <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${i}`} />
                                    <Label htmlFor={`q${currentQuestionIndex}-o${i}`} className="flex-1 cursor-pointer">{option}</Label>
                                </div>
                            )
                        })}
                    </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" className="text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-600" disabled={isAnswerRevealed}>
                                <Lightbulb className="mr-2 h-4 w-4"/> Reveal Answer (-25 pts)
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reveal Answer?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will cost 25 points and reveal the correct answer for this question. You won't be able to change your answer afterwards. Are you sure?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRevealAnswer} className="bg-accent hover:bg-accent/90">Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={handleNext} className="gamify-button bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                        {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}