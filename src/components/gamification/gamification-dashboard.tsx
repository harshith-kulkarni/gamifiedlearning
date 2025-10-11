'use client';

import { useGamification } from '@/contexts/gamification-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Zap, 
  Star, 
  Flame, 
  Target, 
  Medal, 
  Rocket, 
  Crown,
  CheckCircle,
  Circle,
  Lock
} from 'lucide-react';
import { useState } from 'react';
import { ProgressVisualization } from './progress-visualization';
import { AchievementsDisplay } from './achievements-display';
import { ChallengeCenter } from './challenge-center';
import { StreakCalendar } from './streak-calendar';

export function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Get the gamification context
  const gamification = useGamification();

  const getLevelProgress = () => {
    // Calculate points needed for current level
    const pointsNeededForCurrentLevel = 100 + (gamification.level - 1) * 50;
    // Calculate points in current level
    const pointsInCurrentLevel = gamification.points % pointsNeededForCurrentLevel;
    return pointsInCurrentLevel;
  };

  const getLevelProgressPercentage = () => {
    // Calculate points needed for current level
    const pointsNeededForCurrentLevel = 100 + (gamification.level - 1) * 50;
    // Calculate percentage
    return (getLevelProgress() / pointsNeededForCurrentLevel) * 100;
  };

  const getStreakIcon = () => {
    if (gamification.streak >= 30) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (gamification.streak >= 14) return <Medal className="h-6 w-6 text-purple-500" />;
    if (gamification.streak >= 7) return <Flame className="h-6 w-6 text-red-500" />;
    if (gamification.streak >= 3) return <Zap className="h-6 w-6 text-orange-500" />;
    return <Circle className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gamify-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{gamification.level}</p>
              </div>
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <Progress value={getLevelProgressPercentage()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{getLevelProgress()}/{100 + (gamification.level - 1) * 50} XP</p>
          </CardContent>
        </Card>
        
        <Card className="gamify-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{gamification.points}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="gamify-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{gamification.streak}</p>
              </div>
              {getStreakIcon()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="gamify-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Goal</p>
                <p className="text-2xl font-bold">{gamification.dailyProgress}/{gamification.dailyGoal}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={(gamification.dailyProgress / gamification.dailyGoal) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'badges' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('badges')}
        >
          Badges
        </Button>
        <Button
          variant={activeTab === 'quests' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('quests')}
        >
          Quests
        </Button>
        <Button
          variant={activeTab === 'powerups' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('powerups')}
        >
          Power-ups
        </Button>
        <Button
          variant={activeTab === 'progress' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </Button>
        <Button
          variant={activeTab === 'achievements' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </Button>
        <Button
          variant={activeTab === 'challenges' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </Button>
        <Button
          variant={activeTab === 'streak' ? 'default' : 'ghost'}
          className="flex-1"
          onClick={() => setActiveTab('streak')}
        >
          Streak
        </Button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gamification.badges.filter(b => b.earned).slice(0, 3).map(badge => (
                    <div key={badge.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                  {gamification.badges.filter(b => b.earned).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No achievements yet. Start studying to earn your first badge!</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Quests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gamification.quests.filter(q => !q.completed).slice(0, 3).map(quest => (
                    <div key={quest.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{quest.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium">{quest.name}</p>
                          <p className="text-sm text-muted-foreground">{quest.description}</p>
                        </div>
                        <Badge variant="secondary">+{quest.reward} pts</Badge>
                      </div>
                      <Progress value={(quest.progress / quest.target) * 100} />
                      <p className="text-xs text-muted-foreground text-right">{quest.progress}/{quest.target}</p>
                    </div>
                  ))}
                  {gamification.quests.filter(q => !q.completed).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No active quests. Complete challenges to unlock new ones!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'badges' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5" />
                Achievement Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gamification.badges.map(badge => (
                  <div 
                    key={badge.id} 
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-300 ${
                      badge.earned 
                        ? 'border-primary bg-primary/5 hover:shadow-lg' 
                        : 'border-muted opacity-50'
                    }`}
                  >
                    <span className="text-3xl mb-2">{badge.icon}</span>
                    <h3 className="font-medium text-center">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">{badge.description}</p>
                    {badge.earned ? (
                      <Badge variant="default" className="mt-2">Earned</Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-2">Locked</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'quests' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Active Quests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gamification.quests.filter(q => !q.completed).map(quest => (
                    <div key={quest.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{quest.icon}</span>
                          <div>
                            <h3 className="font-medium">{quest.name}</h3>
                            <p className="text-sm text-muted-foreground">{quest.description}</p>
                            <Progress value={(quest.progress / quest.target) * 100} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">{quest.progress}/{quest.target} completed</p>
                          </div>
                        </div>
                        <Badge variant="secondary">+{quest.reward} pts</Badge>
                      </div>
                    </div>
                  ))}
                  {gamification.quests.filter(q => !q.completed).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No active quests. Complete challenges to unlock new ones!</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Completed Quests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gamification.quests.filter(q => q.completed).map(quest => (
                    <div key={quest.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">{quest.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{quest.name}</p>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                      </div>
                      <Badge variant="default">+{quest.reward} pts</Badge>
                    </div>
                  ))}
                  {gamification.quests.filter(q => q.completed).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No completed quests yet. Keep studying to unlock achievements!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'powerups' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Power-ups & Boosters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gamification.powerUps.map(powerUp => (
                  <div 
                    key={powerUp.id} 
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      powerUp.active 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{powerUp.icon}</span>
                        <div>
                          <h3 className="font-medium">{powerUp.name}</h3>
                          <p className="text-sm text-muted-foreground">{powerUp.description}</p>
                          {powerUp.active && powerUp.endTime && (
                            <p className="text-xs text-yellow-600 mt-1">
                              Active until {powerUp.endTime.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => gamification.activatePowerUp(powerUp.id)}
                        disabled={powerUp.active}
                        className={powerUp.active ? 'opacity-50' : ''}
                      >
                        {powerUp.active ? 'Active' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'progress' && (
          <ProgressVisualization />
        )}
        
        {activeTab === 'achievements' && (
          <AchievementsDisplay />
        )}
        
        {activeTab === 'challenges' && (
          <ChallengeCenter />
        )}
        
        {activeTab === 'streak' && (
          <StreakCalendar />
        )}
      </div>
    </div>
  );
}