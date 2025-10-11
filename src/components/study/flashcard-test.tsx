'use client';

import { useState } from 'react';
import { FlashcardViewer } from './flashcard-viewer';
import { FlashcardGenerator } from './flashcard-generator';
import { Flashcard } from '@/lib/models/flashcard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock flashcard data for testing
const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    front: 'What is React?',
    back: 'A JavaScript library for building user interfaces',
    pageNumber: 1,
    sourceText: 'React is a JavaScript library for building user interfaces...',
    confidence: 0.9,
    createdAt: new Date()
  },
  {
    id: '2',
    front: 'What is TypeScript?',
    back: 'A typed superset of JavaScript that compiles to plain JavaScript',
    pageNumber: 2,
    sourceText: 'TypeScript is a typed superset of JavaScript...',
    confidence: 0.85,
    createdAt: new Date()
  },
  {
    id: '3',
    front: 'What is Next.js?',
    back: 'A React framework for production with features like SSR and SSG',
    pageNumber: 3,
    sourceText: 'Next.js is a React framework for production...',
    confidence: 0.8,
    createdAt: new Date()
  }
];

export function FlashcardTest() {
  const [view, setView] = useState<'generator' | 'viewer'>('generator');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const handleFlashcardsGenerated = (generatedFlashcards: Flashcard[]) => {
    setFlashcards(generatedFlashcards);
    setView('viewer');
  };

  const handleBackToPdf = () => {
    setView('generator');
  };

  const handleUseMockData = () => {
    setFlashcards(mockFlashcards);
    setView('viewer');
  };

  return (
    <div className="h-screen p-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Flashcard System Test</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={view === 'generator' ? 'default' : 'outline'}
              onClick={() => setView('generator')}
            >
              Generator
            </Button>
            <Button
              variant={view === 'viewer' ? 'default' : 'outline'}
              onClick={() => setView('viewer')}
              disabled={flashcards.length === 0}
            >
              Viewer ({flashcards.length} cards)
            </Button>
            <Button
              variant="outline"
              onClick={handleUseMockData}
            >
              Use Mock Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-full">
          {view === 'generator' ? (
            <FlashcardGenerator
              taskId="test-task-123"
              onToggleView={handleBackToPdf}
              onFlashcardsGenerated={handleFlashcardsGenerated}
            />
          ) : (
            <FlashcardViewer
              flashcards={flashcards}
              taskId="test-task-123"
              pdfTitle="Test Document"
              onBackToPdf={handleBackToPdf}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}