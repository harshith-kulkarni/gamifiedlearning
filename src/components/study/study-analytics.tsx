'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/auth-context';

interface StudySessionData {
  date: string;
  duration: number;
  score: number;
  points: number;
}

export function StudyAnalytics() {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<StudySessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;

        const response = await fetch('/api/user/study-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSessionData(data.sessions);
        }
      } catch (error) {
        console.error('Failed to fetch session data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalStudyTime = sessionData.reduce((total, session) => total + session.duration, 0);
  const averageScore = sessionData.length > 0 
    ? sessionData.reduce((total, session) => total + session.score, 0) / sessionData.length 
    : 0;
  const totalPoints = sessionData.reduce((total, session) => total + session.points, 0);

  // Group sessions by date for better visualization
  const groupedData = sessionData.reduce((acc, session) => {
    const existingDate = acc.find(item => item.date === session.date);
    if (existingDate) {
      existingDate.duration += session.duration;
      existingDate.points += session.points;
      existingDate.sessionCount += 1;
    } else {
      acc.push({
        date: session.date,
        duration: session.duration,
        points: session.points,
        score: session.score,
        sessionCount: 1
      });
    }
    return acc;
  }, [] as Array<{
    date: string;
    duration: number;
    points: number;
    score: number;
    sessionCount: number;
  }>);

  // Sort by date
  groupedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <span className="text-2xl">⏱️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</div>
            <p className="text-xs text-muted-foreground">
              Across {sessionData.length} sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Quiz performance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <span className="text-2xl">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Points earned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.progress.streak || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Study Time Over Time</CardTitle>
            <CardDescription>
              Daily study duration in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value} minutes`, 'Study Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Points Earned</CardTitle>
            <CardDescription>
              Points earned per study session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value} points`, 'Points']}
                />
                <Bar dataKey="points" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Study Sessions</CardTitle>
          <CardDescription>
            Your latest study activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessionData.slice(-5).reverse().map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{new Date(session.date).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.duration} minutes • {session.score}% score
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+{session.points} points</p>
                </div>
              </div>
            ))}
            {sessionData.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No study sessions yet. Start studying to see your progress!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}