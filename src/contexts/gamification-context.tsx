'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
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
  coins: number; // Tracks answer reveals in quiz
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
  addStudySessionPoints: (minutes: number, completedSuccessfully: boolean, has2xPowerUp?: boolean) => number;
  addQuizPoints: (correctAnswers: number, wrongAnswers: number, answersRevealed: number) => number;

  buyPowerUp: (powerUpId: string) => boolean;
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
  calculateLevelFromPoints: (totalPoints: number) => number;
  calculatePointsForNextLevel: (currentLevel: number, currentPoints: number) => number;
  useCoin: () => boolean; // Returns false if coins >= 3
  resetCoins: () => void; // Reset coins for new quiz
  syncToDatabase: () => Promise<boolean>; // Manual sync to database
  fetchLatestProgress: () => Promise<boolean>; // Fetch latest from database
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, getValidToken } = useAuth();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [coins, setCoins] = useState(0); // Tracks answer reveals in quiz
  const [dailyGoal, setDailyGoal] = useState(30); // 30 minutes default
  const [dailyProgress, setDailyProgress] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);

  // Initialize badges with default values
  const defaultBadges: Badge[] = [
    { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: false, rarity: 'common' },
    { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: false, rarity: 'rare' },
    { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: false, rarity: 'common' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: false, rarity: 'rare' },
    { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: false, rarity: 'common' },
    { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: false, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: false, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: false, rarity: 'epic' },
    // Flashcard badges
    { id: 'first-flashcard', name: 'First Flashcard', description: 'Create your first flashcard', icon: '📇', earned: false, rarity: 'common' },
    { id: 'flashcard-collector', name: 'Card Collector', description: 'Create 10 flashcards', icon: '🗂️', earned: false, rarity: 'common' },
    { id: 'flashcard-hoarder', name: 'Card Hoarder', description: 'Create 50 flashcards', icon: '📚', earned: false, rarity: 'rare' },
    { id: 'flashcard-library', name: 'Living Library', description: 'Create 100 flashcards', icon: '🏛️', earned: false, rarity: 'epic' },
    { id: 'knowledge-seeker', name: 'Knowledge Seeker', description: 'Master 25 flashcards', icon: '🔍', earned: false, rarity: 'rare' },
    { id: 'knowledge-master', name: 'Knowledge Master', description: 'Master 100 flashcards', icon: '🧠', earned: false, rarity: 'epic' },
    { id: 'flashcard-streak-7', name: 'Card Streak', description: 'Review flashcards for 7 days straight', icon: '🔥', earned: false, rarity: 'rare' },
    { id: 'flashcard-streak-30', name: 'Card Marathon', description: 'Review flashcards for 30 days straight', icon: '🏃', earned: false, rarity: 'legendary' },
    { id: 'active-reviewer', name: 'Active Reviewer', description: 'Review 20+ cards in a week', icon: '⚡', earned: false, rarity: 'rare' },
  ];

  const [badges, setBadges] = useState<Badge[]>(defaultBadges);

  // Initialize power-ups
  const [powerUps, setPowerUps] = useState<PowerUp[]>([
    { id: 'double-points', name: 'Double Points', description: 'Earn 2x points for 30 minutes', icon: '✨', active: false, duration: 1800, multiplier: 2 },
    { id: 'time-extension', name: 'Time Extension', description: 'Add 10 minutes to your study session', icon: '⏰', active: false, duration: 0 },
    { id: 'hint-revealer', name: 'Hint Revealer', description: 'Reveal one correct answer per quiz', icon: '💡', active: false, duration: 1800 },
    { id: 'focus-mode', name: 'Focus Mode', description: 'Eliminate distractions for 1 hour', icon: '🎯', active: false, duration: 3600 },
  ]);

  // Initialize quests with default values
  const defaultQuests: Quest[] = [
    { id: 'study-60', name: 'Hour Master', description: 'Study for 60 minutes total', icon: '⏱️', progress: 0, target: 60, reward: 50, completed: false, category: 'study' },
    { id: 'quiz-5', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '📝', progress: 0, target: 5, reward: 75, completed: false, category: 'quiz' },
    { id: 'ai-chat-10', name: 'Chat Champion', description: 'Ask 10 questions to AI tutor', icon: '💬', progress: 0, target: 10, reward: 40, completed: false, category: 'ai' },
    { id: 'streak-30', name: 'Monthly Streak', description: 'Maintain a 30-day study streak', icon: '📅', progress: 0, target: 30, reward: 150, completed: false, category: 'consistency' },
    // Flashcard quests
    { id: 'flashcard-creator', name: 'Card Creator', description: 'Generate 20 flashcards using AI', icon: '🤖', progress: 0, target: 20, reward: 60, completed: false, category: 'flashcard' },
    { id: 'flashcard-reviewer', name: 'Dedicated Reviewer', description: 'Review 50 flashcards', icon: '📖', progress: 0, target: 50, reward: 80, completed: false, category: 'flashcard' },
    { id: 'knowledge-master', name: 'Master of Knowledge', description: 'Mark 30 flashcards as known', icon: '🎓', progress: 0, target: 30, reward: 100, completed: false, category: 'flashcard' },
    { id: 'ai-powered-learning', name: 'AI-Powered Learning', description: 'Generate flashcards from 10 different PDFs', icon: '🧠', progress: 0, target: 10, reward: 120, completed: false, category: 'flashcard' },
  ];

  const [quests, setQuests] = useState<Quest[]>(defaultQuests);

  // Initialize challenges
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 'speed-quiz', name: 'Speed Quiz', description: 'Complete a quiz in under 3 minutes', icon: '🏃', reward: 30, completed: false, difficulty: 'medium' },
    { id: 'perfect-day', name: 'Perfect Day', description: 'Study for your daily goal without interruptions', icon: '⭐', reward: 45, completed: false, difficulty: 'hard' },
    { id: 'ai-master', name: 'AI Master', description: 'Ask 5 questions in one study session', icon: '🤖', reward: 35, completed: false, difficulty: 'medium' },
    { id: 'early-riser', name: 'Early Riser', description: 'Start studying before 6 AM', icon: '🌅', reward: 25, completed: false, difficulty: 'easy' },
  ]);

  // Initialize achievements with default values
  const defaultAchievements: Achievement[] = [
    { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: false, points: 10 },
    { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: false, points: 50 },
    { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: false, points: 75 },
    { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: false, points: 100 },
    // Flashcard achievements
    { id: 'flashcard-apprentice', name: 'Flashcard Apprentice', description: 'Master 50% of your flashcards', icon: '🎓', earned: false, points: 50 },
    { id: 'flashcard-expert', name: 'Flashcard Expert', description: 'Master 80% of your flashcards', icon: '🏆', earned: false, points: 100 },
    { id: 'flashcard-master', name: 'Flashcard Master', description: 'Master 95% of your flashcards', icon: '👑', earned: false, points: 200 },
    { id: 'ai-learning-pioneer', name: 'AI Learning Pioneer', description: 'Generate 100 AI-powered flashcards', icon: '🚀', earned: false, points: 150 },
  ];

  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);

  // Sync with database when user changes
  useEffect(() => {
    if (user) {
      // Safely access user.progress with fallbacks
      const progress = user.progress || {};
      setPoints(progress.points || 0);
      setLevel(progress.level || 1);
      setStreak(progress.streak || 0);
      setCoins(0); // Reset coins for each session
      setTotalStudyTime(progress.totalStudyTime || 0);
      setDailyGoal(progress.dailyGoal || 30);
      setBadges(progress.badges || defaultBadges);
      setQuests(progress.quests || defaultQuests);
      setAchievements(progress.achievements || defaultAchievements);

      // Calculate daily progress (today's study time)
      if (user.progress.studySessions) {
        const today = new Date().toISOString().split('T')[0];
        const todaysSessions = user.progress.studySessions.filter(
          (session: any) => session.completedAt && session.completedAt.toString().split('T')[0] === today
        );
        const todaysTime = todaysSessions.reduce((total: number, session: any) => total + (session.duration || 0), 0);
        setDailyProgress(Math.min(todaysTime, user.progress.dailyGoal || 30));
      }
    } else {
      // Reset to default values when no user or progress
      setPoints(0);
      setLevel(1);
      setStreak(0);
      setCoins(0);
      setTotalStudyTime(0);
      setDailyGoal(30);
      setDailyProgress(0);
      setBadges(defaultBadges);
      setQuests(defaultQuests);
      setAchievements(defaultAchievements);
    }
  }, [user]);

  // Real-time sync progress to database with validation
  const syncToDatabase = useCallback(async () => {
    if (!user) {
      console.warn('No user found, skipping sync');
      return false;
    }

    try {
      const token = getValidToken();
      if (!token) {
        console.warn('No valid auth token found, cannot sync progress');
        return false;
      }

      // Format data according to database schema with strict validation
      const progressData = {
        points: Math.max(0, Math.floor(points || 0)),
        level: Math.max(1, Math.floor(level || 1)),
        streak: Math.max(0, Math.floor(streak || 0)),
        totalStudyTime: Math.max(0, Math.floor(totalStudyTime || 0)),
        dailyGoal: Math.max(1, Math.floor(dailyGoal || 30)),
        badges: (badges || []).map((badge: Badge) => ({
          id: String(badge.id || ''),
          name: String(badge.name || ''),
          description: String(badge.description || ''),
          icon: String(badge.icon || ''),
          earned: Boolean(badge.earned),
          ...(badge.earnedAt && { earnedAt: new Date(badge.earnedAt) }),
          ...(badge.rarity && { rarity: badge.rarity })
        })),
        quests: (quests || []).map((quest: Quest) => ({
          id: String(quest.id || ''),
          name: String(quest.name || ''),
          description: String(quest.description || ''),
          icon: String(quest.icon || ''),
          progress: Math.max(0, Math.floor(quest.progress || 0)),
          target: Math.max(1, Math.floor(quest.target || 1)),
          reward: Math.max(0, Math.floor(quest.reward || 0)),
          completed: Boolean(quest.completed),
          ...(quest.completedAt && { completedAt: new Date(quest.completedAt) }),
          ...(quest.category && { category: String(quest.category) })
        })),
        achievements: (achievements || []).map((achievement: Achievement) => ({
          id: String(achievement.id || ''),
          name: String(achievement.name || ''),
          description: String(achievement.description || ''),
          icon: String(achievement.icon || ''),
          earned: Boolean(achievement.earned),
          ...(achievement.earnedAt && { earnedAt: new Date(achievement.earnedAt) }),
          points: Math.max(0, Math.floor(achievement.points || 0))
        })),
        lastStudyDate: new Date(),
        updatedAt: new Date()
      };

      // Syncing progress to database

      const response = await fetch('/api/user/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Failed to sync progress:', response.status, errorData);
        return false;
      } else {
        // Progress synced successfully
        return true;
      }
    } catch (error) {
      console.error('❌ Error syncing progress:', error);
      return false;
    }
  }, [user, points, level, streak, totalStudyTime, dailyGoal, badges, quests, achievements, getValidToken]);

  // Fetch latest progress from database for real-time sync
  const fetchLatestProgress = useCallback(async () => {
    if (!user) return false;

    try {
      const token = getValidToken();
      if (!token) return false;

      const response = await fetch('/api/user/progress', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const progress = data.progress;

        if (progress) {
          // Successfully fetched latest progress from database

          // Update local state with database values
          setPoints(progress.points || 0);
          setLevel(progress.level || 1);
          setStreak(progress.streak || 0);
          setTotalStudyTime(progress.totalStudyTime || 0);
          setDailyGoal(progress.dailyGoal || 30);
          setBadges(progress.badges || defaultBadges);
          setQuests(progress.quests || defaultQuests);
          setAchievements(progress.achievements || defaultAchievements);

          return true;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching latest progress:', error);
    }
    return false;
  }, [user, getValidToken]);

  // Debounced auto-sync progress when important data changes
  useEffect(() => {
    if (user && points >= 0) {
      const timeoutId = setTimeout(() => {
        syncToDatabase();
      }, 2000); // 2 seconds debounce to prevent excessive API calls

      return () => clearTimeout(timeoutId);
    }
  }, [user, points, level, streak, totalStudyTime, badges, quests, achievements, syncToDatabase]);

  // Periodic sync to ensure consistency (reduced frequency)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchLatestProgress();
    }, 300000); // Fetch latest every 5 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [user, fetchLatestProgress]);

  // Initial fetch on user change
  useEffect(() => {
    if (user && user.progress) {
      fetchLatestProgress();
    }
  }, [user, fetchLatestProgress]);

  // Level calculation based on points - CORRECTED SYSTEM
  // Level 1: 100 points, Level 2: 150 points, Level 3: 200 points (+50 for each level)
  const calculateLevelFromPoints = useCallback((totalPoints: number) => {
    if (totalPoints < 100) return 1;

    let currentLevel = 1;
    let pointsUsed = 0;
    let pointsForNextLevel = 100; // Points needed for level 2

    while (pointsUsed + pointsForNextLevel <= totalPoints) {
      pointsUsed += pointsForNextLevel;
      currentLevel++;
      pointsForNextLevel = 100 + (currentLevel - 1) * 50; // Level 2=150, Level 3=200, etc.
    }

    return currentLevel;
  }, []);

  // Calculate points needed for next level
  const calculatePointsForNextLevel = useCallback((currentLevel: number, currentPoints: number) => {
    let pointsUsed = 0;

    // Calculate total points used for all previous levels
    for (let level = 1; level < currentLevel; level++) {
      if (level === 1) {
        pointsUsed += 100;
      } else {
        pointsUsed += 100 + (level - 1) * 50;
      }
    }

    // Points needed for next level
    const pointsForNextLevel = 100 + (currentLevel - 1) * 50;
    const pointsInCurrentLevel = currentPoints - pointsUsed;

    return pointsForNextLevel - pointsInCurrentLevel;
  }, []);

  // Define earnBadge first to avoid dependency issues
  const earnBadge = useCallback((badgeId: string) => {
    setBadges((prev: Badge[]) => prev.map((badge: Badge) =>
      badge.id === badgeId && !badge.earned
        ? { ...badge, earned: true, earnedAt: new Date() }
        : badge
    ));
  }, []);

  // Level up system with +100 bonus points
  useEffect(() => {
    const newLevel = calculateLevelFromPoints(points);
    if (newLevel > level) {
      setLevel(newLevel);
      // If level increased then +100 points
      setPoints((prev: number) => prev + 100);

      // Award level up badge
      if (newLevel >= 5) {
        earnBadge('scholar');
      }
    }
  }, [points, level, calculateLevelFromPoints, earnBadge]);

  // Check for point-based badges
  useEffect(() => {
    if (points >= 100) {
      earnBadge('points-100');
    }
  }, [points, earnBadge]);

  // Check for streak badges
  useEffect(() => {
    if (streak >= 7) {
      earnBadge('streak-7');
    }
  }, [streak, earnBadge]);

  // Power-up timer
  useEffect(() => {
    const interval = setInterval(() => {
      setPowerUps((prev: PowerUp[]) => prev.map((powerUp: PowerUp) => {
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

  // Actions - Updated according to new point system
  const addPoints = useCallback((amount: number) => {
    // Check for active 2x power-up
    const doublePointsActive = powerUps.some((p: PowerUp) => p.id === 'double-points' && p.active);
    const actualAmount = doublePointsActive ? amount * 2 : amount;
    setPoints((prev: number) => Math.max(0, prev + actualAmount)); // Prevent negative points
  }, [powerUps]);

  // Study session points according to new system
  const addStudySessionPoints = useCallback((minutes: number, completedSuccessfully: boolean, has2xPowerUp: boolean = false) => {
    if (completedSuccessfully) {
      // If session completed successfully then time in minutes * 5 points to be added
      let pointsEarned = minutes * 5;
      // If a 2x powerup is active then multiply the points scored by 2
      if (has2xPowerUp) {
        pointsEarned = pointsEarned * 2;
      }
      addPoints(pointsEarned);
      return pointsEarned;
    } else {
      // If session ended before then -25 points
      addPoints(-25);
      return -25;
    }
  }, [addPoints]);



  // Quiz points according to new system
  const addQuizPoints = useCallback((correctAnswers: number, wrongAnswers: number, answersRevealed: number) => {
    // For every correct answer +5 points
    const correctPoints = correctAnswers * 5;
    // For every wrong answer -1 point
    const wrongPoints = wrongAnswers * -1;
    // If answer revealed then -10 points
    const revealedPoints = answersRevealed * -10;

    const totalPoints = correctPoints + wrongPoints + revealedPoints;
    addPoints(totalPoints);
    return totalPoints;
  }, [addPoints]);

  const activatePowerUp = useCallback((powerUpId: string) => {
    setPowerUps((prev: PowerUp[]) => prev.map((powerUp: PowerUp) => {
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

  // Power-up purchases - deduct 100 points
  const buyPowerUp = useCallback((powerUpId: string) => {
    const powerUpCost = 100; // If user buys a powerup then deduct 100 points

    if (points >= powerUpCost) {
      setPoints((prev: number) => prev - powerUpCost);
      activatePowerUp(powerUpId);
      return true;
    }
    return false;
  }, [points, activatePowerUp]);

  // Streak system - if study session created for sequential days then streak is increased
  const incrementStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastStudyDate = localStorage.getItem('lastStudyDate');

    if (lastStudyDate !== today) {
      // Check if it's consecutive days
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastStudyDate === yesterdayStr) {
        // Consecutive day - increment streak
        setStreak((prev: number) => prev + 1);
      } else if (lastStudyDate !== today) {
        // Not consecutive - reset streak to 1
        setStreak(1);
      }

      localStorage.setItem('lastStudyDate', today);
    }
    // If already studied today, don't change streak
  }, []);

  const resetStreak = useCallback(() => {
    setStreak(0);
  }, []);

  const completeQuest = useCallback((questId: string) => {
    setQuests((prev: Quest[]) => prev.map((quest: Quest) =>
      quest.id === questId && !quest.completed
        ? { ...quest, completed: true, completedAt: new Date(), progress: quest.target }
        : quest
    ));

    // Award points for completing quest
    const quest = quests.find((q: Quest) => q.id === questId);
    if (quest) {
      addPoints(quest.reward);
    }
  }, [quests, addPoints]);

  const completeChallenge = useCallback((challengeId: string) => {
    setChallenges((prev: Challenge[]) => prev.map((challenge: Challenge) =>
      challenge.id === challengeId && !challenge.completed
        ? { ...challenge, completed: true, completedAt: new Date() }
        : challenge
    ));

    // Award points for completing challenge
    // Find the challenge in the previous state to get its reward value
    const challengeReward = challenges.find((c: Challenge) => c.id === challengeId)?.reward || 0;
    if (challengeReward > 0) {
      addPoints(challengeReward);
    }
  }, [challenges, addPoints]);

  const updateDailyProgress = useCallback((amount: number) => {
    setDailyProgress((prev: number) => {
      const newProgress = prev + amount;
      return newProgress > dailyGoal ? dailyGoal : newProgress;
    });
  }, [dailyGoal]);

  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements((prev: Achievement[]) => prev.map((achievement: Achievement) =>
      achievement.id === achievementId && !achievement.earned
        ? { ...achievement, earned: true, earnedAt: new Date() }
        : achievement
    ));

    // Award points for unlocking achievement
    const achievement = achievements.find((a: Achievement) => a.id === achievementId);
    if (achievement) {
      addPoints(achievement.points);
    }
  }, [achievements, addPoints]);

  const addStudyTime = useCallback((minutes: number) => {
    setTotalStudyTime((prev: number) => prev + minutes);
    updateDailyProgress(minutes);

    // Check for study time achievements
    if (totalStudyTime + minutes >= 120) {
      unlockAchievement('marathon-study');
    }
  }, [totalStudyTime, updateDailyProgress, unlockAchievement]);

  // Coins system - tracks answer reveals in quiz
  const useCoin = useCallback(() => {
    if (coins >= 3) {
      return false; // If coins==3 then we can't do any other answer reveals
    }
    setCoins((prev: number) => prev + 1);
    return true;
  }, [coins]);

  const resetCoins = useCallback(() => {
    setCoins(0); // Reset coins for new quiz
  }, []);

  const checkQuestProgress = useCallback((questId: string, progress: number) => {
    setQuests((prev: Quest[]) => prev.map((quest: Quest) => {
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
    coins,
    badges,
    powerUps,
    quests,
    challenges,
    achievements,
    dailyGoal,
    dailyProgress,
    totalStudyTime,
    addPoints,
    addStudySessionPoints,
    addQuizPoints,

    buyPowerUp,
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
    calculateLevelFromPoints,
    calculatePointsForNextLevel,
    useCoin,
    resetCoins,
    syncToDatabase,
    fetchLatestProgress,
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