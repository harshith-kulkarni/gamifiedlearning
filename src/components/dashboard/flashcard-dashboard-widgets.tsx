'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Library, 
  BookOpen, 
  Brain, 
  RotateCcw, 
  TrendingUp, 
  Clock, 
  Target,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SavedFlashcard, CardAction } from '@/lib/models/flashcard';
// import { useFlashcardGamification } from '@/hooks/use-flashcard-gamification';

interface FlashcardStats {
  total: number;
  saved: number;
  known: number;
  review: number;
  totalReviews: number;
  averageReviews: number;
  recentActivity: number;
  studyStreak: number;
}

interface FlashcardDashboardWidgetsProps {
  className?: string;
}

export function FlashcardDashboardWidgets({ className }: FlashcardDashboardWidgetsProps) {
  const [stats, setStats] = useState<FlashcardStats>({
    total: 0,
    saved: 0,
    known: 0,
    review: 0,
    totalReviews: 0,
    averageReviews: 0,
    recentActivity: 0,
    studyStreak: 0,
  });
  const [recentFlashcards, setRecentFlashcards] = useState<SavedFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  
  // Gamification integration - temporarily disabled to prevent API pinging
  // const { checkFlashcardBadges, trackFlashcardMastery } = useFlashcardGamification();

  // Fetch flashcard statistics and recent activity
  const fetchFlashcardData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/study/save-flashcards', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Silent fail for auth issues - don't set error state
          setIsLoading(false);
          return;
        }
        if (response.status === 404) {
          // No flashcards found - this is normal, not an error
          setStats({
            total: 0,
            saved: 0,
            known: 0,
            review: 0,
            totalReviews: 0,
            averageReviews: 0,
            recentActivity: 0,
            studyStreak: 0,
          });
          setRecentFlashcards([]);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch flashcard data`);
      }

      const data = await response.json();
      if (data.success && data.data.flashcards) {
        const flashcards = data.data.flashcards;
        
        // Calculate statistics
        const total = flashcards.length;
        const saved = flashcards.filter((f: SavedFlashcard) => f.status === 'saved').length;
        const known = flashcards.filter((f: SavedFlashcard) => f.status === 'known').length;
        const review = flashcards.filter((f: SavedFlashcard) => f.status === 'review').length;
        const totalReviews = flashcards.reduce((acc: number, f: SavedFlashcard) => acc + f.reviewCount, 0);
        const averageReviews = total > 0 ? Math.round((totalReviews / total) * 10) / 10 : 0;
        
        // Calculate recent activity (flashcards reviewed in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivity = flashcards.filter((f: SavedFlashcard) => 
          f.lastReviewed && new Date(f.lastReviewed) > sevenDaysAgo
        ).length;

        // Calculate study streak (consecutive days with flashcard activity)
        const studyStreak = calculateStudyStreak(flashcards);

        const newStats = {
          total,
          saved,
          known,
          review,
          totalReviews,
          averageReviews,
          recentActivity,
          studyStreak,
        };

        setStats(newStats);

        // Get recent flashcards (last 5 created or reviewed)
        const recent = flashcards
          .sort((a: SavedFlashcard, b: SavedFlashcard) => {
            const aDate = new Date(a.lastReviewed || a.createdAt);
            const bDate = new Date(b.lastReviewed || b.createdAt);
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, 5);
        
        setRecentFlashcards(recent);
      }
    } catch (err: any) {
      console.error('Error fetching flashcard data:', err);
      // Only set error if it's not a network issue
      if (!err.message?.includes('Failed to fetch')) {
        setError(err.message || 'Failed to load flashcard data');
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []); // Empty dependencies to prevent re-creation

  // Calculate study streak based on flashcard activity
  const calculateStudyStreak = (flashcards: SavedFlashcard[]): number => {
    if (flashcards.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);

    // Check each day going backwards
    for (let i = 0; i < 30; i++) { // Check up to 30 days
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const hasActivity = flashcards.some((f: SavedFlashcard) => {
        const reviewDate = f.lastReviewed ? new Date(f.lastReviewed) : null;
        const createDate = new Date(f.createdAt);
        
        return (reviewDate && reviewDate >= dayStart && reviewDate <= dayEnd) ||
               (createDate >= dayStart && createDate <= dayEnd);
      });

      if (hasActivity) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today) if no activity
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  // Load data on component mount only once
  useEffect(() => {
    // Only fetch if we have an auth token
    const token = localStorage.getItem('auth-token');
    if (token) {
      fetchFlashcardData();
    } else {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount

  // Gamification integration temporarily disabled to prevent API pinging issues
  // TODO: Re-implement gamification integration with proper memoization
  // const gamificationStats = useMemo(() => ({
  //   total: stats.total,
  //   known: stats.known,
  //   review: stats.review,
  //   studyStreak: stats.studyStreak,
  //   recentActivity: stats.recentActivity,
  // }), [stats.total, stats.known, stats.review, stats.studyStreak, stats.recentActivity]);

  // useEffect(() => {
  //   if (gamificationStats.total > 0) {
  //     try {
  //       checkFlashcardBadges(gamificationStats);
  //       trackFlashcardMastery(gamificationStats.known, gamificationStats.total);
  //     } catch (error) {
  //       console.warn('Gamification update failed:', error);
  //     }
  //   }
  // }, [gamificationStats.total, gamificationStats.known, gamificationStats.review, gamificationStats.studyStreak, gamificationStats.recentActivity]);

  // Memoized calculations
  const knowledgeProgress = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.known / stats.total) * 100);
  }, [stats.known, stats.total]);

  const reviewProgress = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.saved + stats.known) / stats.total) * 100);
  }, [stats.saved, stats.known, stats.total]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Library className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Unable to load flashcard data</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFlashcardData}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Flashcard Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No flashcards yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first flashcards from a study session to start tracking your progress.
              </p>
              <Link href="/dashboard/create-task">
                <Button size="sm">
                  Start Study Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Flashcard Overview */}
        <Card className="gamify-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Library className="h-4 w-4" />
              Flashcard Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.total}</span>
                <Badge variant="secondary" className="text-xs">
                  Total Cards
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-blue-600">{stats.saved}</div>
                  <div className="text-muted-foreground">Saved</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{stats.known}</div>
                  <div className="text-muted-foreground">Known</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-600">{stats.review}</div>
                  <div className="text-muted-foreground">Review</div>
                </div>
              </div>
              <Link href="/dashboard/saved-flashcards">
                <Button variant="outline" size="sm" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Progress */}
        <Card className="gamify-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Knowledge Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{knowledgeProgress}%</span>
                <Badge variant={knowledgeProgress >= 70 ? "default" : "secondary"} className="text-xs">
                  {knowledgeProgress >= 70 ? "Great!" : "Keep Going"}
                </Badge>
              </div>
              <Progress value={knowledgeProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {stats.known} of {stats.total} cards mastered
              </div>
              {stats.review > 0 && (
                <Link href="/dashboard/saved-flashcards?status=review">
                  <Button variant="outline" size="sm" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Review {stats.review} Cards
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Activity */}
        <Card className="gamify-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Study Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.studyStreak}</span>
                <Badge variant={stats.studyStreak >= 3 ? "default" : "secondary"} className="text-xs">
                  Day Streak
                </Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recent Activity</span>
                  <span className="font-medium">{stats.recentActivity} cards</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Reviews</span>
                  <span className="font-medium">{stats.averageReviews}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last 7 days activity
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Flashcards */}
      {recentFlashcards.length > 0 && (
        <Card className="mt-4 gamify-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Flashcards
              </CardTitle>
              <Link href="/dashboard/saved-flashcards">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFlashcards.map((flashcard) => (
                <div
                  key={flashcard._id?.toString()}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {flashcard.question}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {flashcard.pdfTitle}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          flashcard.status === 'known' ? 'default' :
                          flashcard.status === 'saved' ? 'secondary' : 'destructive'
                        }
                        className="text-xs capitalize"
                      >
                        {flashcard.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {flashcard.reviewCount} reviews
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mt-4 gamify-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/saved-flashcards?status=review">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <RotateCcw className="h-4 w-4 mr-2" />
                Review Cards
              </Button>
            </Link>
            <Link href="/dashboard/create-task">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}