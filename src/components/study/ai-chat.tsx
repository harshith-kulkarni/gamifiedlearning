'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { aiChatbotAssistance } from '@/ai/flows/ai-chatbot-assistance';
import { Logo } from '../icons';

interface AIChatProps {
    pdfDataUri: string;
}

type Message = {
    role: 'user' | 'bot' | 'error';
    content: string;
};

export function AIChat({ pdfDataUri }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: "I am your AI study master. Ask me anything about the document!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiChatbotAssistance({ pdfDataUri, question: currentInput });
            setMessages([...newMessages, { role: 'bot', content: response.answer }]);
        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'error', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center">
                 <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="font-headline">AI Study Master</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 p-0">
                <ScrollArea className="flex-1 p-4" viewportRef={scrollViewportRef}>
                    <div className="space-y-4 pr-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role !== 'user' && (
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback className={msg.role === 'error' ? 'bg-destructive' : 'bg-primary'}>
                                            {msg.role === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive-foreground"/> : <Logo className="h-4 w-4 text-primary-foreground"/>}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : msg.role === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <Avatar className="h-8 w-8 border">
                                   <AvatarFallback className="bg-primary">
                                    <Logo className="h-4 w-4 text-primary-foreground"/>
                                   </AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-lg p-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            </div>
                         )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background/50">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." disabled={isLoading} />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
