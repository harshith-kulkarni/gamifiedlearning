'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudySession } from '@/contexts/study-session-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, ArrowRight, Lightbulb, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQuizQuestions, type GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions-from-pdf';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function QuizPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { taskInfo, setQuizQuestions: setContextQuizQuestions, quizQuestions, addQuizAnswer, getAnswerForQuestion, useCoin, coinsUsed } = useStudySession();

    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);

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

    const handleNext = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
             router.push(`/dashboard/feedback/${params.id}`);
        }
    };
    
    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleRevealAnswer = () => {
        useCoin();
        addPenalty(25); // Apply 25 point penalty when using a coin
        setRevealedAnswers(prev => [...prev, currentQuestionIndex]);
    };
    
    const isAnswerRevealed = revealedAnswers.includes(currentQuestionIndex);

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <Card className="shadow-lg">
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
                                <Coins className="mr-2 h-4 w-4"/> Use Coin (-25 pts)
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
                    <Button onClick={handleNext} className="bg-accent hover:bg-accent/90">
                        {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
