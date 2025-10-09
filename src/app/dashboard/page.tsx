'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Star, CheckCircle, Package } from "lucide-react";
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

  useEffect(() => {
    // This effect will run on the client side
    // It will load completed sessions from the context
    const formattedTasks: Task[] = completedSessions.map(session => ({
      id: session.id,
      title: session.taskName,
      status: 'Completed',
      date: new Date().toISOString().split('T')[0], // Use current date for simplicity
      points: session.points,
    }));
    setTasks(formattedTasks);
  }, [completedSessions]);
  
  const totalPoints = tasks.reduce((acc, task) => acc + task.points, 0);
  const sortedTasks = tasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline">Your Study Dashboard</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              Welcome back! Here's an overview of your progress. Ready to start a new session?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/create-task">
                <Button className="bg-accent hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Study Session
                </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Points</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
                <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                {totalPoints.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Keep up the great work!
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks Completed</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                {tasks.filter(t => t.status === 'Completed').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status !== 'Completed').length} tasks pending
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                  <TableRow key={task.id}>
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
                            <Button variant="secondary" size="sm">Start a new session</Button>
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
