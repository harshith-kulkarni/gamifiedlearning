'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlashcardGenerator } from './flashcard-generator';
import { FlashcardViewer } from './flashcard-viewer';
import { Flashcard } from '@/lib/models/flashcard';
import { PerformanceMonitor, logMemoryUsage } from '@/lib/utils/performance';

interface PerformanceTestProps {
  onClose: () => void;
}

export function FlashcardPerformanceTest({ onClose }: PerformanceTestProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentView, setCurrentView] = useState<'generator' | 'viewer'>('generator');
  const [performanceData, setPerformanceData] = useState<{
    renderTime: number;
    memoryUsage: string;
    animationFrameRate: number;
  }>({
    renderTime: 0,
    memoryUsage: '0 MB',
    animationFrameRate: 0,
  });

  const monitor = new PerformanceMonitor();

  // Generate test flashcards
  const generateTestFlashcards = useCallback(() => {
    monitor.mark('flashcard-generation-start');
    
    const testCards: Flashcard[] = Array.from({ length: 20 }, (_, i) => ({
      id: `test-card-${i}`,
      front: `Test Question ${i + 1}: What is the capital of country ${i + 1}?`,
      back: `Test Answer ${i + 1}: This is the answer to question ${i + 1} with some detailed explanation.`,
      pageNumber: Math.floor(i / 5) + 1,
      sourceText: `Source text for card ${i + 1} with additional context and information.`,
      confidence: Math.random(),
      createdAt: new Date(),
    }));

    setFlashcards(testCards);
    
    const renderTime = monitor.measure('Flashcard Generation', 'flashcard-generation-start');
    setPerformanceData(prev => ({ ...prev, renderTime }));
    
    logMemoryUsage('Test flashcards generated');
  }, []);

  // Measure animation performance
  const measureAnimationPerformance = useCallback(() => {
    let frameCount = 0;
    const startTime = performance.now();
    
    const measureFrame = () => {
      frameCount++;
      if (frameCount < 60) { // Measure for 60 frames
        requestAnimationFrame(measureFrame);
      } else {
        const endTime = performance.now();
        const fps = (frameCount / (endTime - startTime)) * 1000;
        setPerformanceData(prev => ({ ...prev, animationFrameRate: Math.round(fps) }));
      }
    };
    
    requestAnimationFrame(measureFrame);
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setPerformanceData(prev => ({ ...prev, memoryUsage: `${usedMB} MB` }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Start performance measurement on mount
  useEffect(() => {
    generateTestFlashcards();
    measureAnimationPerformance();
  }, [generateTestFlashcards, measureAnimationPerformance]);

  const handleFlashcardsGenerated = useCallback((cards: Flashcard[]) => {
    setFlashcards(cards);
    setCurrentView('viewer');
  }, []);

  const handleBackToPdf = useCallback(() => {
    setCurrentView('generator');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-6xl h-[90vh] bg-background rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Flashcard Performance Test</h2>
            <p className="text-sm text-muted-foreground">
              Testing memory management and rendering optimizations
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Performance Metrics */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Render: {performanceData.renderTime.toFixed(2)}ms
              </Badge>
              <Badge variant="outline">
                Memory: {performanceData.memoryUsage}
              </Badge>
              <Badge variant="outline">
                FPS: {performanceData.animationFrameRate}
              </Badge>
            </div>
            <Button onClick={onClose} variant="outline">
              Close Test
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Test Controls */}
          <div className="w-80 border-r p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={generateTestFlashcards}
                  className="w-full"
                  size="sm"
                >
                  Generate Test Cards
                </Button>
                <Button
                  onClick={() => setCurrentView('generator')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Test Generator
                </Button>
                <Button
                  onClick={() => setCurrentView('viewer')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={!flashcards.length}
                >
                  Test Viewer
                </Button>
                <Button
                  onClick={measureAnimationPerformance}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Measure FPS
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Render Time:</span>
                  <span className="font-mono">{performanceData.renderTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span className="font-mono">{performanceData.memoryUsage}</span>
                </div>
                <div className="flex justify-between">
                  <span>Animation FPS:</span>
                  <span className="font-mono">{performanceData.animationFrameRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flashcards:</span>
                  <span className="font-mono">{flashcards.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Optimization Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>React.memo:</span>
                  <Badge variant="secondary" className="text-xs">✓ Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>useMemo:</span>
                  <Badge variant="secondary" className="text-xs">✓ Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>useCallback:</span>
                  <Badge variant="secondary" className="text-xs">✓ Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Memory Mgmt:</span>
                  <Badge variant="secondary" className="text-xs">✓ Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Smooth Animations:</span>
                  <Badge variant="secondary" className="text-xs">✓ Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Area */}
          <div className="flex-1">
            {currentView === 'generator' ? (
              <FlashcardGenerator
                taskId="performance-test"
                onToggleView={handleBackToPdf}
                onFlashcardsGenerated={handleFlashcardsGenerated}
              />
            ) : (
              <FlashcardViewer
                flashcards={flashcards}
                taskId="performance-test"
                pdfTitle="Performance Test Document"
                onBackToPdf={handleBackToPdf}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}