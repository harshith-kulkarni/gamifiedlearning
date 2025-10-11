'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlashcardViewer } from './flashcard-viewer';
import { Flashcard } from '@/lib/models/flashcard';
import { Settings, Maximize2, Minimize2, RotateCw, Info } from 'lucide-react';

interface FlashcardLayoutDemoProps {
  onClose: () => void;
}

export function FlashcardLayoutDemo({ onClose }: FlashcardLayoutDemoProps) {
  // Generate demo flashcards with varying content lengths
  const demoFlashcards: Flashcard[] = [
    {
      id: 'demo-1',
      front: 'Short Question: What is AI?',
      back: 'Artificial Intelligence (AI) is computer technology that simulates human intelligence.',
      pageNumber: 1,
      sourceText: 'AI encompasses machine learning, natural language processing, and computer vision.',
      confidence: 0.8,
      createdAt: new Date(),
    },
    {
      id: 'demo-2',
      front: 'Medium Length Question: How do neural networks work and what are their key components?',
      back: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers: input layer, hidden layers, and output layer. Each connection has a weight that adjusts during training through backpropagation.',
      pageNumber: 2,
      sourceText: 'Neural networks learn by adjusting weights between neurons based on training data. The process involves forward propagation to make predictions and backward propagation to update weights based on errors.',
      confidence: 0.9,
      createdAt: new Date(),
    },
    {
      id: 'demo-3',
      front: 'Long Complex Question: Explain the differences between supervised, unsupervised, and reinforcement learning, including their use cases, advantages, and limitations in modern machine learning applications?',
      back: 'Supervised learning uses labeled data to train models for prediction tasks like classification and regression. Examples include email spam detection and house price prediction. Unsupervised learning finds patterns in unlabeled data through clustering and dimensionality reduction, useful for customer segmentation and anomaly detection. Reinforcement learning trains agents through trial and error with rewards and penalties, excelling in game playing, robotics, and autonomous systems. Each approach has distinct advantages: supervised learning provides clear objectives, unsupervised learning discovers hidden patterns, and reinforcement learning handles sequential decision-making.',
      pageNumber: 3,
      sourceText: 'The choice between learning paradigms depends on data availability, problem complexity, and desired outcomes. Supervised learning requires extensive labeled datasets but provides interpretable results. Unsupervised learning works with raw data but may produce ambiguous insights. Reinforcement learning handles dynamic environments but requires careful reward design and extensive computational resources.',
      confidence: 0.7,
      createdAt: new Date(),
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-7xl h-[95vh] bg-background rounded-lg shadow-xl flex">
        {/* Demo Info Panel */}
        <div className="w-80 border-r p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Layout Controls Demo</h2>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                New Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-start">
                  <Settings className="h-3 w-3 mr-2" />
                  Adjustable Layout Controls
                </Badge>
                <p className="text-xs text-muted-foreground pl-2">
                  Click "Layout" button to access size controls
                </p>
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-start">
                  <Maximize2 className="h-3 w-3 mr-2" />
                  Compact/Normal Toggle
                </Badge>
                <p className="text-xs text-muted-foreground pl-2">
                  Quick switch between compact and normal views
                </p>
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-start">
                  <RotateCw className="h-3 w-3 mr-2" />
                  Dynamic Sizing
                </Badge>
                <p className="text-xs text-muted-foreground pl-2">
                  Adjust height, width, font size, and spacing
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <strong>Card Height:</strong>
                <p>300px - 700px range for different screen sizes</p>
              </div>
              <div>
                <strong>Card Width:</strong>
                <p>60% - 100% of available space</p>
              </div>
              <div>
                <strong>Font Size:</strong>
                <p>70% - 150% scaling for readability</p>
              </div>
              <div>
                <strong>Spacing:</strong>
                <p>50% - 150% padding and margins</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <strong>1. Layout Button:</strong>
                <p>Click to open/close the layout controls panel</p>
              </div>
              <div>
                <strong>2. Compact Toggle:</strong>
                <p>Quick switch for smaller cards and text</p>
              </div>
              <div>
                <strong>3. Sliders:</strong>
                <p>Fine-tune each aspect of the card appearance</p>
              </div>
              <div>
                <strong>4. Reset:</strong>
                <p>Return to default settings anytime</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Test Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Badge variant="outline" className="w-full justify-start">
                Card 1: Short content
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                Card 2: Medium content
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                Card 3: Long complex content
              </Badge>
              <p className="text-muted-foreground mt-2">
                Navigate through cards to see how layout controls work with different content lengths.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Flashcard Viewer with Layout Controls */}
        <div className="flex-1">
          <FlashcardViewer
            flashcards={demoFlashcards}
            taskId="layout-demo"
            pdfTitle="Layout Controls Demo"
            onBackToPdf={() => {
              // Demo completed
              console.log('Layout demo completed');
            }}
          />
        </div>
      </div>
    </div>
  );
}