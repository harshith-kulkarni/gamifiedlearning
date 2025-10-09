
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStudySession } from '@/contexts/study-session-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function CreateTaskPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { setTaskInfo, resetSession, setStudyDuration: setTimer } = useStudySession();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [studyMinutes, setStudyMinutes] = useState<number | string>(25);

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            if (files[0].type !== 'application/pdf') {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File Type',
                    description: 'Please upload a PDF file.',
                });
                return;
            }
            setFile(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-primary');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
        handleFileChange(e.dataTransfer.files);
    };

    const handleCreateSession = async () => {
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
        
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + 5;
            });
        }, 200);

        setTimeout(() => {
            clearInterval(progressInterval);
            setProgress(100);
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setTaskInfo({ name: file.name, dataUri: reader.result as string });
                const newTaskId = `task-${Date.now()}`;
                
                toast({
                    title: 'Session Ready!',
                    description: `Your study session for ${file.name} is ready.`,
                });
                router.push(`/dashboard/study/${newTaskId}`);
            };
            reader.onerror = () => {
                 toast({ variant: 'destructive', title: 'Error reading file' });
                 setIsProcessing(false);
                 setProgress(0);
            }
        }, 1000);
    };

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
                                <p className="mt-2 font-semibold">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
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
                                {progress < 30 ? 'Uploading file...' : progress < 70 ? 'Analyzing document with AI...' : 'Generating study session...'}
                            </p>
                        </div>
                    )}
                    <Button onClick={handleCreateSession} disabled={!file || isProcessing} size="lg" className="w-full bg-accent hover:bg-accent/90">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Create Study Session
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
