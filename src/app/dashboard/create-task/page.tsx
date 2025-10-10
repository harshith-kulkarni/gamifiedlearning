'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStudySession } from '@/contexts/study-session-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { processPDFFile, getFileNameWithoutExtension, formatFileSize } from '@/lib/pdf-utils';
import { pregenerateQuizQuestions } from '@/app/actions/quiz-actions';

export default function CreateTaskPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { setTaskInfo, resetSession, setStudyDuration: setTimer, setPrefetchedQuizQuestions } = useStudySession();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [studyMinutes, setStudyMinutes] = useState<number | string>(25);

    const handleFileChange = useCallback((files: FileList | null) => {
        if (files && files[0]) {
            setFile(files[0]);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-primary');
    }, []);
    
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
        handleFileChange(e.dataTransfer.files);
    }, [handleFileChange]);

    const handleCreateSession = useCallback(async () => {
        if (!file) {
            toast({
                variant: 'destructive',
                title: 'No File Selected',
                description: 'Please select a PDF file to start a study session.',
            });
            return;
        }
        
        resetSession();
        setIsProcessing(true);
        setProgress(0);
        
        const duration = Number(studyMinutes);
        if (isNaN(duration) || duration <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Duration',
                description: 'Please enter a valid study duration.',
            });
            setIsProcessing(false);
            return;
        }
        setTimer(duration * 60);
        
        // Simulate processing progress
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev; // Leave some progress for AI generation
                return prev + 5;
            });
        }, 200);

        setTimeout(async () => {
            clearInterval(progressInterval);
            
            try {
                // Process the PDF file
                const result = await processPDFFile(file);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                setProgress(90);
                setTaskInfo({ 
                    name: getFileNameWithoutExtension(file.name), 
                    dataUri: result.dataUri! 
                });
                
                // Pre-generate quiz questions in the background
                const newTaskId = `task-${Date.now()}`;
                toast({
                    title: 'Session Ready!',
                    description: `Your study session for ${file.name} is ready.`,
                });
                
                // Start pre-generating quiz questions while user studies
                pregenerateQuizQuestions(result.dataUri!)
                    .then((quizResult) => {
                        if (quizResult.success && quizResult.questions) {
                            setPrefetchedQuizQuestions(quizResult.questions);
                            console.log('Quiz questions pre-generated successfully');
                        } else {
                            console.log('Failed to pre-generate quiz questions:', quizResult.error);
                        }
                    })
                    .catch((error) => {
                        console.error('Error pre-generating quiz questions:', error);
                    });
                
                router.push(`/dashboard/study/${newTaskId}`);
            } catch (error) {
                console.error('Error processing file:', error);
                toast({ 
                    variant: 'destructive', 
                    title: 'Error processing file',
                    description: error instanceof Error ? error.message : 'An unknown error occurred'
                });
                setIsProcessing(false);
                setProgress(0);
            }
        }, 1000);
    }, [file, studyMinutes, resetSession, setTimer, setTaskInfo, router, toast, setPrefetchedQuizQuestions]);

    return (
        <div className="container mx-auto max-w-3xl py-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Create a New Study Session</CardTitle>
                    <CardDescription>Upload a PDF document to begin your interactive learning experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div 
                        className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input id="file-upload" type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                        {file ? (
                            <div className="text-center text-primary">
                                <FileText className="mx-auto h-12 w-12" />
                                <p className="mt-2 font-semibold truncate max-w-xs">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <Upload className="mx-auto h-12 w-12" />
                                <p className="mt-2 font-semibold">Drag & drop your PDF here</p>
                                <p className="text-sm">or click to browse</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="study-time">Study Duration (minutes)</Label>
                        <Input 
                            id="study-time"
                            type="number"
                            value={studyMinutes}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    setStudyMinutes('');
                                } else {
                                    setStudyMinutes(Math.max(1, parseInt(value, 10)));
                                }
                            }}
                            min="1"
                            className="max-w-xs"
                        />
                    </div>

                    {isProcessing && (
                        <div className="space-y-2 pt-4">
                            <Progress value={progress} className="w-full" />
                            <p className="text-sm text-muted-foreground text-center animate-pulse">
                                {progress < 30 ? 'Uploading file...' : progress < 70 ? 'Analyzing document with AI...' : progress < 90 ? 'Generating study session...' : 'Preparing quiz questions...'}
                            </p>
                        </div>
                    )}
                    <Button 
                        onClick={handleCreateSession} 
                        disabled={!file || isProcessing} 
                        size="lg" 
                        className="w-full bg-accent hover:bg-accent/90"
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Create Study Session
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}