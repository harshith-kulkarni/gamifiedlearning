'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Star, CheckCircle, Package, Trophy, Zap, Flame, Target } from "lucide-react";
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

// Task interface matching the data structure
interface Task {
  id: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'To Do';
  date: string;
  points: number;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { completedSessions } = useStudySession();
  const { points, level, streak, badges, quests, challenges } = useGamification();

  // Memoize the task transformation to prevent unnecessary re-renders
  const formattedTasks = useMemo(() => {
    return completedSessions.map(session => ({
      id: session.id,
      title: session.taskName,
      status: 'Completed' as const,
      date: new Date().toISOString().split('T')[0], // Use current date for simplicity
      points: session.points,
    }));
  }, [completedSessions]);

  useEffect(() => {
    setTasks(formattedTasks);
  }, [formattedTasks]);
  
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
      <GamificationDashboard />

      <Card className="gamify-card">
        <CardHeader className="px-7">
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>
            An overview of your completed study sessions.
          </CardDescription>
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
              {sortedTasks.length > 0 ? (
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