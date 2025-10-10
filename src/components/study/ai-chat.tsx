'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { aiChatbotAssistanceStream } from '@/ai/flows/ai-chatbot-assistance';
import { Logo } from '../icons';

interface AIChatProps {
    pdfDataUri: string;
}

type Message = {
    role: 'user' | 'bot' | 'error';
    content: string;
};

// Memoize the AIChat component to prevent unnecessary re-renders
export const AIChat = memo(function AIChat({ pdfDataUri }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: "I am your AI study master. Ask me anything about the document!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Scroll to bottom effect
    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, [messages, streamingMessage]);

    // Memoize the send message function
    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Add user message to chat
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setStreamingMessage('');

        try {
            // Create abort controller for cancellation
            abortControllerRef.current = new AbortController();
            
            // Get streaming response
            const chunks = await aiChatbotAssistanceStream({ pdfDataUri, question: input });
            
            // Build the response progressively
            let accumulatedResponse = '';
            setStreamingMessage('');
            
            for (const chunk of chunks) {
                // Check if operation was cancelled
                if (abortControllerRef.current?.signal.aborted) break;
                
                accumulatedResponse += chunk;
                setStreamingMessage(accumulatedResponse);
                
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            // Add final bot message if not cancelled
            if (!abortControllerRef.current?.signal.aborted) {
                const botMessage: Message = { role: 'bot', content: accumulatedResponse };
                setMessages(prev => [...prev, botMessage]);
                setStreamingMessage('');
            }
        } catch (error) {
            console.error(error);
            const errorMessage: Message = { role: 'error', content: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
            setStreamingMessage('');
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [input, isLoading, pdfDataUri]);
    
    // Handle cancel streaming
    const handleCancelStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setStreamingMessage('');
    }, []);

    return (
        <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary animate-pulse" />
                    <CardTitle className="font-headline">AI Study Master</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0">
                <ScrollArea className="flex-grow p-4" viewportRef={scrollViewportRef}>
                    <div className="space-y-4 pr-4">
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            >
                                {msg.role !== 'user' && (
                                    <Avatar className="h-8 w-8 border animate-bounceIn flex-shrink-0">
                                        <AvatarFallback className={msg.role === 'error' ? 'bg-destructive' : 'bg-primary'}>
                                            {msg.role === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive-foreground"/> : <Logo className="h-4 w-4 text-primary-foreground"/>}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-[80%] rounded-lg p-3 text-sm transition-all duration-300 ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground rounded-br-none animate-slideInRight' 
                                        : msg.role === 'error' 
                                            ? 'bg-destructive/10 text-destructive rounded-bl-none animate-shake' 
                                            : 'bg-muted rounded-bl-none animate-slideInLeft'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {streamingMessage && (
                            <div className="flex items-end gap-2 justify-start animate-fadeIn">
                                <Avatar className="h-8 w-8 border animate-bounce flex-shrink-0">
                                    <AvatarFallback className="bg-primary">
                                        <Logo className="h-4 w-4 text-primary-foreground"/>
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-lg p-3 rounded-bl-none animate-pulse">
                                    <div className="flex items-center gap-1">
                                        <span>{streamingMessage}</span>
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {isLoading && !streamingMessage && (
                            <div className="flex items-end gap-2 justify-start animate-fadeIn">
                                <Avatar className="h-8 w-8 border animate-bounce flex-shrink-0">
                                    <AvatarFallback className="bg-primary">
                                        <Logo className="h-4 w-4 text-primary-foreground"/>
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-lg p-3 rounded-bl-none">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background/50 mt-auto">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Ask a question..." 
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    handleSendMessage(e);
                                }
                            }}
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2">
                            {isLoading && (
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="icon" 
                                    onClick={handleCancelStreaming}
                                    className="transition-all duration-300 hover:scale-105"
                                >
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={isLoading || !input.trim()} 
                                className="bg-accent hover:bg-accent/90 transition-all duration-300 hover:scale-105"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
});