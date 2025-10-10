'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

// Types for our gamification system
export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
};

export type PowerUp = {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  duration: number; // in seconds
  endTime?: Date;
  multiplier?: number; // for point multipliers
};

export type Quest = {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  completedAt?: Date;
  category?: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  completed: boolean;
  completedAt?: Date;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  points: number;
};

interface GamificationContextType {
  points: number;
  level: number;
  streak: number;
  badges: Badge[];
  powerUps: PowerUp[];
  quests: Quest[];
  challenges: Challenge[];
  achievements: Achievement[];
  dailyGoal: number;
  dailyProgress: number;
  totalStudyTime: number;
  
  // Actions
  addPoints: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  earnBadge: (badgeId: string) => void;
  activatePowerUp: (powerUpId: string) => void;
  completeQuest: (questId: string) => void;
  completeChallenge: (challengeId: string) => void;
  updateDailyProgress: (amount: number) => void;
  checkQuestProgress: (questId: string, progress: number) => void;
  addStudyTime: (minutes: number) => void;
  unlockAchievement: (achievementId: string) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(30); // 30 minutes default
  const [dailyProgress, setDailyProgress] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  
  // Initialize badges
  const [badges, setBadges] = useState<Badge[]>([
    { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: false, rarity: 'common' },
    { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: false, rarity: 'rare' },
    { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: false, rarity: 'common' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: false, rarity: 'rare' },
    { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: false, rarity: 'common' },
    { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: false, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: false, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: false, rarity: 'epic' },
  ]);
  
  // Initialize power-ups
  const [powerUps, setPowerUps] = useState<PowerUp[]>([
    { id: 'double-points', name: 'Double Points', description: 'Earn 2x points for 30 minutes', icon: '✨', active: false, duration: 1800, multiplier: 2 },
    { id: 'time-extension', name: 'Time Extension', description: 'Add 10 minutes to your study session', icon: '⏰', active: false, duration: 0 },
    { id: 'hint-revealer', name: 'Hint Revealer', description: 'Reveal one correct answer per quiz', icon: '💡', active: false, duration: 1800 },
    { id: 'focus-mode', name: 'Focus Mode', description: 'Eliminate distractions for 1 hour', icon: '🎯', active: false, duration: 3600 },
  ]);
  
  // Initialize quests
  const [quests, setQuests] = useState<Quest[]>([
    { id: 'study-60', name: 'Hour Master', description: 'Study for 60 minutes total', icon: '⏱️', progress: 0, target: 60, reward: 50, completed: false, category: 'study' },
    { id: 'quiz-5', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '📝', progress: 0, target: 5, reward: 75, completed: false, category: 'quiz' },
    { id: 'ai-chat-10', name: 'Chat Champion', description: 'Ask 10 questions to AI tutor', icon: '💬', progress: 0, target: 10, reward: 40, completed: false, category: 'ai' },
    { id: 'streak-30', name: 'Monthly Streak', description: 'Maintain a 30-day study streak', icon: '📅', progress: 0, target: 30, reward: 150, completed: false, category: 'consistency' },
  ]);
  
  // Initialize challenges
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 'speed-quiz', name: 'Speed Quiz', description: 'Complete a quiz in under 3 minutes', icon: '🏃', reward: 30, completed: false, difficulty: 'medium' },
    { id: 'perfect-day', name: 'Perfect Day', description: 'Study for your daily goal without interruptions', icon: '⭐', reward: 45, completed: false, difficulty: 'hard' },
    { id: 'ai-master', name: 'AI Master', description: 'Ask 5 questions in one study session', icon: '🤖', reward: 35, completed: false, difficulty: 'medium' },
    { id: 'early-riser', name: 'Early Riser', description: 'Start studying before 6 AM', icon: '🌅', reward: 25, completed: false, difficulty: 'easy' },
  ]);
  
  // Initialize achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: false, points: 10 },
    { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: false, points: 50 },
    { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: false, points: 75 },
    { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: false, points: 100 },
  ]);

  // Sync with database when user changes
  useEffect(() => {
    if (user) {
      setPoints(user.progress.points);
      setLevel(user.progress.level);
      setStreak(user.progress.streak);
      setTotalStudyTime(user.progress.totalStudyTime);
      setDailyGoal(user.progress.dailyGoal);
      setBadges(user.progress.badges);
      setQuests(user.progress.quests);
      setAchievements(user.progress.achievements);
      
      // Calculate daily progress (today's study time)
      const today = new Date().toISOString().split('T')[0];
      const todaysSessions = user.progress.studySessions.filter(
        session => session.completedAt.toString().split('T')[0] === today
      );
      const todaysTime = todaysSessions.reduce((total, session) => total + session.duration, 0);
      setDailyProgress(Math.min(todaysTime, dailyGoal));
    }
  }, [user, dailyGoal]);

  // Sync progress to database
  const syncToDatabase = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      await fetch('/api/user/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          points,
          level,
          streak,
          totalStudyTime,
          dailyGoal,
          badges,
          quests,
          achievements,
        }),
      });
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  }, [user, points, level, streak, totalStudyTime, dailyGoal, badges, quests, achievements]);

  // Level calculation based on points
  useEffect(() => {
    const newLevel = Math.floor(points / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      // Award level up badge
      if (newLevel >= 5) {
        earnBadge('scholar');
      }
    }
  }, [points, level]);

  // Check for point-based badges
  useEffect(() => {
    if (points >= 100) {
      earnBadge('points-100');
    }
  }, [points]);

  // Check for streak badges
  useEffect(() => {
    if (streak >= 7) {
      earnBadge('streak-7');
    }
  }, [streak]);

  // Power-up timer
  useEffect(() => {
    const interval = setInterval(() => {
      setPowerUps(prev => prev.map(powerUp => {
        if (powerUp.active && powerUp.endTime) {
          const now = new Date();
          if (now >= powerUp.endTime) {
            return { ...powerUp, active: false, endTime: undefined };
          }
        }
        return powerUp;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Actions
  const addPoints = useCallback((amount: number) => {
    // Check for active double points power-up
    const doublePointsActive = powerUps.some(p => p.id === 'double-points' && p.active);
    const actualAmount = doublePointsActive ? amount * 2 : amount;
    setPoints(prev => prev + actualAmount);
  }, [powerUps]);

  const incrementStreak = useCallback(() => {
    setStreak(prev => prev + 1);
  }, []);

  const resetStreak = useCallback(() => {
    setStreak(0);
  }, []);

  const earnBadge = useCallback((badgeId: string) => {
    setBadges(prev => prev.map(badge => 
      badge.id === badgeId && !badge.earned 
        ? { ...badge, earned: true, earnedAt: new Date() } 
        : badge
    ));
  }, []);

  const activatePowerUp = useCallback((powerUpId: string) => {
    setPowerUps(prev => prev.map(powerUp => {
      if (powerUp.id === powerUpId) {
        if (powerUp.duration > 0) {
          const endTime = new Date();
          endTime.setSeconds(endTime.getSeconds() + powerUp.duration);
          return { ...powerUp, active: true, endTime };
        } else {
          // Instant power-up (like time extension)
          return { ...powerUp, active: false };
        }
      }
      return powerUp;
    }));
  }, []);

  const completeQuest = useCallback((questId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId && !quest.completed 
        ? { ...quest, completed: true, completedAt: new Date(), progress: quest.target } 
        : quest
    ));
    
    // Award points for completing quest
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      addPoints(quest.reward);
    }
  }, [quests, addPoints]);

  const completeChallenge = useCallback((challengeId: string) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId && !challenge.completed 
        ? { ...challenge, completed: true, completedAt: new Date() } 
        : challenge
    ));
    
    // Award points for completing challenge
    // Find the challenge in the previous state to get its reward value
    const challengeReward = challenges.find(c => c.id === challengeId)?.reward || 0;
    if (challengeReward > 0) {
      addPoints(challengeReward);
    }
  }, [challenges, addPoints]);

  const updateDailyProgress = useCallback((amount: number) => {
    setDailyProgress(prev => {
      const newProgress = prev + amount;
      return newProgress > dailyGoal ? dailyGoal : newProgress;
    });
  }, [dailyGoal]);

  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements(prev => prev.map(achievement => 
      achievement.id === achievementId && !achievement.earned 
        ? { ...achievement, earned: true, earnedAt: new Date() } 
        : achievement
    ));
    
    // Award points for unlocking achievement
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      addPoints(achievement.points);
    }
  }, [achievements, addPoints]);

  const addStudyTime = useCallback((minutes: number) => {
    setTotalStudyTime(prev => prev + minutes);
    updateDailyProgress(minutes);
    
    // Check for study time achievements
    if (totalStudyTime + minutes >= 120) {
      unlockAchievement('marathon-study');
    }
  }, [totalStudyTime, updateDailyProgress, unlockAchievement]);

  const checkQuestProgress = useCallback((questId: string, progress: number) => {
    setQuests(prev => prev.map(quest => {
      if (quest.id === questId && !quest.completed) {
        const newProgress = Math.min(quest.progress + progress, quest.target);
        const completed = newProgress >= quest.target;
        
        if (completed) {
          completeQuest(questId);
        }
        
        return { ...quest, progress: newProgress, completed };
      }
      return quest;
    }));
  }, [completeQuest]);

  const value = {
    points,
    level,
    streak,
    badges,
    powerUps,
    quests,
    challenges,
    achievements,
    dailyGoal,
    dailyProgress,
    totalStudyTime,
    addPoints,
    incrementStreak,
    resetStreak,
    earnBadge,
    activatePowerUp,
    completeQuest,
    completeChallenge,
    updateDailyProgress,
    checkQuestProgress,
    addStudyTime,
    unlockAchievement,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}