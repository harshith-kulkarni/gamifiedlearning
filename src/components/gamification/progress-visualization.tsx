'use client';

import { useGamification } from '@/contexts/gamification-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Trophy,
  Zap,
  Star,
  Flame
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ProgressVisualization() {
  const { points, level, streak, dailyGoal, dailyProgress, totalStudyTime, quests, challenges } = useGamification();

  // Mock data for study time trend (in a real app, this would come from a database)
  const studyData = [
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 30 },
    { day: 'Wed', minutes: 60 },
    { day: 'Thu', minutes: 40 },
    { day: 'Fri', minutes: 75 },
    { day: 'Sat', minutes: 90 },
    { day: 'Sun', minutes: 60 },
  ];

  // Calculate completion rates
  const completedQuests = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;
  const questCompletionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalChallenges = challenges.length;
  const challengeCompletionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gamify-card animate-float">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{level}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary animate-pulseGlow" />
            </div>
            <Progress value={(points % 100)} max={100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{points % 100}/100 XP to next level</p>
          </CardContent>
        </Card>
        
        <Card className="gamify-card animate-float" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{points}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-pulseGlow" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="gamify-card animate-float" style={{ animationDelay: '0.4s' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{streak}</p>
              </div>
              <Flame className="h-8 w-8 text-red-500 animate-pulseGlow" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="gamify-card animate-float" style={{ animationDelay: '0.6s' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold">{totalStudyTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-green-500 animate-pulseGlow" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Time Trend */}
      <Card className="gamify-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Study Time Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={studyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#673AB7" 
                  fill="#673AB7" 
                  fillOpacity={0.2} 
                  activeDot={{ r: 8 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="gamify-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quest Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion Rate</span>
                  <span>{questCompletionRate.toFixed(0)}%</span>
                </div>
                <Progress value={questCompletionRate} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>{completedQuests}/{totalQuests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="gamify-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Challenge Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion Rate</span>
                  <span>{challengeCompletionRate.toFixed(0)}%</span>
                </div>
                <Progress value={challengeCompletionRate} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>{completedChallenges}/{totalChallenges}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Goal Progress */}
      <Card className="gamify-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Daily Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Today's Progress</span>
                <span>{dailyProgress}/{dailyGoal} minutes</span>
              </div>
              <Progress value={(dailyProgress / dailyGoal) * 100} className="h-3" />
            </div>
            <div className="flex justify-between text-sm">
              <span>Status</span>
              <span className={dailyProgress >= dailyGoal ? 'text-green-600 font-medium' : 'text-orange-600'}>
                {dailyProgress >= dailyGoal ? 'Goal Achieved! 🎉' : 'Keep Going!'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}