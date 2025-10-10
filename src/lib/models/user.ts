import { ObjectId } from 'mongodb';

export interface StudySession {
  id: string;
  taskName: string;
  duration: number; // in minutes
  score: number;
  points: number;
  completedAt: Date;
  quizAnswers?: Array<{
    questionIndex: number;
    answer: string;
    correct: boolean;
  }>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Quest {
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
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
  points: number;
}

export interface UserProgress {
  level: number;
  points: number;
  streak: number;
  lastStudyDate?: Date;
  totalStudyTime: number; // in minutes
  dailyGoal: number; // in minutes
  badges: Badge[];
  quests: Quest[];
  achievements: Achievement[];
  studySessions: StudySession[];
}

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  progress: UserProgress;
}

export const defaultUserProgress: UserProgress = {
  level: 1,
  points: 0,
  streak: 0,
  totalStudyTime: 0,
  dailyGoal: 30,
  badges: [
    { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎓', earned: false, rarity: 'common' },
    { id: 'streak-7', name: 'Week Streak', description: 'Study for 7 days in a row', icon: '🔥', earned: false, rarity: 'rare' },
    { id: 'points-100', name: 'Centurion', description: 'Earn 100 points', icon: '💯', earned: false, rarity: 'common' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🏆', earned: false, rarity: 'rare' },
    { id: 'early-bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🐦', earned: false, rarity: 'common' },
    { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: false, rarity: 'common' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 5 minutes', icon: '⚡', earned: false, rarity: 'epic' },
    { id: 'scholar', name: 'Scholar', description: 'Complete 10 quizzes', icon: '📚', earned: false, rarity: 'epic' },
  ],
  quests: [
    { id: 'study-60', name: 'Hour Master', description: 'Study for 60 minutes total', icon: '⏱️', progress: 0, target: 60, reward: 50, completed: false, category: 'study' },
    { id: 'quiz-5', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '📝', progress: 0, target: 5, reward: 75, completed: false, category: 'quiz' },
    { id: 'ai-chat-10', name: 'Chat Champion', description: 'Ask 10 questions to AI tutor', icon: '💬', progress: 0, target: 10, reward: 40, completed: false, category: 'ai' },
    { id: 'streak-30', name: 'Monthly Streak', description: 'Maintain a 30-day study streak', icon: '📅', progress: 0, target: 30, reward: 150, completed: false, category: 'consistency' },
  ],
  achievements: [
    { id: 'first-session', name: 'First Session', description: 'Complete your first study session', icon: '🎯', earned: false, points: 10 },
    { id: 'marathon-study', name: 'Marathon Study', description: 'Study for 2 hours in one session', icon: '🏃', earned: false, points: 50 },
    { id: 'consistent-week', name: 'Consistent Week', description: 'Study every day for a week', icon: '📅', earned: false, points: 75 },
    { id: 'quiz-expert', name: 'Quiz Expert', description: 'Score 90% or higher on 5 quizzes', icon: '📝', earned: false, points: 100 },
  ],
  studySessions: [],
};