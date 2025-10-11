'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Star, CheckCircle, Package, Trophy, Zap, Flame, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStudySession } from "@/contexts/study-session-context";
import { useGamification } from "@/contexts/gamification-context";
import { GamificationDashboard } from "@/components/gamification/gamification-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { SyncStatus } from "@/components/dashboard/sync-status";

// Task interface matching the data structure
interface Task {
  id: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'To Do';
  date: string;
  points: number;
}

// Generate unique ID
const generateUniqueId = (prefix: string, index: number) => {
  return `${prefix}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const { completedSessions } = useStudySession();
  const { points, level, streak, badges, quests, challenges, fetchLatestProgress } = useGamification();

  // Real-time fetch tasks from database with auto-refresh
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch latest progress first
      await fetchLatestProgress();

      const response = await fetch('/api/user/study-session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedTasks = data.sessions.map((session: any, index: number) => ({
          id: session.sessionId || generateUniqueId('api_session', index),
          title: session.taskName || 'Study Session',
          status: 'Completed' as const,
          date: session.date,
          points: session.points,
        }));
        setTasks(formattedTasks);
        // Dashboard data refreshed from database
      } else {
        // Fallback to local sessions if API fails
        const formattedTasks = completedSessions.map((session, index) => ({
          id: session.id || generateUniqueId('local_session', index),
          title: session.taskName,
          status: 'Completed' as const,
          date: new Date().toISOString().split('T')[0],
          points: session.points,
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      // Fallback to local sessions
      const formattedTasks = completedSessions.map((session, index) => ({
        id: session.id || generateUniqueId('fallback_session', index),
        title: session.taskName,
        status: 'Completed' as const,
        date: new Date().toISOString().split('T')[0],
        points: session.points,
      }));
      setTasks(formattedTasks);
    } finally {
      setIsLoading(false);
      setLastRefresh(Date.now());
    }
  }, [completedSessions, fetchLatestProgress]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auto-refresh when new sessions are completed
  useEffect(() => {
    fetchTasks();
  }, [completedSessions.length, fetchTasks]);

  // Periodic refresh every 5 minutes for updates (reduced from 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 300000); // 5 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [fetchTasks]);
  
  // Memoize calculations
  const totalPoints = useMemo(() => tasks.reduce((acc, task) => acc + task.points, 0), [tasks]);
  const completedCount = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter(t => t.status !== 'Completed').length, [tasks]);
  const sortedTasks = useMemo(() => tasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [tasks]);

  // Get earned badges count
  const earnedBadgesCount = useMemo(() => badges.filter(b => b.earned).length, [badges]);
  
  // Get active quests count
  const activeQuestsCount = useMemo(() => quests.filter(q => !q.completed).length, [quests]);
  
  // Get completed challenges count
  const completedChallengesCount = useMemo(() => challenges.filter(c => c.completed).length, [challenges]);

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2 gamify-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline">Your Study Dashboard</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              Welcome back! Here's an overview of your progress. Ready to start a new session?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/create-task">
                <Button className="gamify-button bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Study Session
                </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="gamify-card">
          <CardHeader className="pb-2">
            <CardDescription>Level</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
                <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                {level}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {points} total points
            </div>
          </CardContent>
        </Card>
        <Card className="gamify-card">
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
                <Flame className="h-8 w-8 text-red-500" />
                {streak}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Keep it up!
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gamification Dashboard */}
      <ErrorBoundary>
        <GamificationDashboard />
      </ErrorBoundary>

      <Card className="gamify-card">
        <CardHeader className="px-7">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>
                An overview of your completed study sessions.
              </CardDescription>
              <div className="mt-2">
                <SyncStatus />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Points Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <TableRow key={`loading-skeleton-${i}`}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="h-6 bg-muted rounded animate-pulse w-20" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 bg-muted rounded animate-pulse w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <TableRow key={task.id} className="gamify-card">
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {task.id}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="default">
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(task.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{task.points > 0 ? `+${task.points}`: '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No tasks completed yet.</p>
                        <Link href="/dashboard/create-task">
                            <Button variant="secondary" size="sm" className="gamify-button">Start a new session</Button>
                        </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}