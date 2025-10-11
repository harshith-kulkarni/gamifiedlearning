'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface StudySessionData {
  date: string;
  duration: number;
  score: number;
  points: number;
}

export interface StudyTrendData {
  date: string;
  minutes: number;
  sessionCount: number;
}

export function useStudyData() {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<StudySessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchSessionData = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Prevent excessive API calls - only fetch if more than 30 seconds have passed
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < 30000 && sessionData.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user/study-session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionData(data.sessions || []);
        setLastFetch(now);
        console.log('✅ Study data refreshed from database');
      } else {
        console.error('Failed to fetch session data:', response.status);
        setSessionData([]);
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      setSessionData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastFetch, sessionData.length]);

  // Initial fetch and real-time updates
  useEffect(() => {
    fetchSessionData();
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessionData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSessionData]);

  // Process data for trend visualization
  const getTrendData = useCallback((days: number = 7): StudyTrendData[] => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Filter sessions within the date range
    const filteredSessions = sessionData.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Group by date and aggregate
    const trendMap: { [key: string]: { minutes: number; sessionCount: number } } = {};
    
    filteredSessions.forEach(session => {
      const dateKey = session.date;
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { minutes: 0, sessionCount: 0 };
      }
      trendMap[dateKey].minutes += session.duration;
      trendMap[dateKey].sessionCount += 1;
    });

    // Fill missing dates with 0 values and format for chart
    const result: StudyTrendData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      result.push({
        date: dayName,
        minutes: trendMap[dateKey]?.minutes || 0,
        sessionCount: trendMap[dateKey]?.sessionCount || 0,
      });
    }

    return result;
  }, [sessionData]);

  // Calculate summary statistics
  const getStats = useCallback(() => {
    const totalStudyTime = sessionData.reduce((total, session) => total + session.duration, 0);
    const averageScore = sessionData.length > 0 
      ? sessionData.reduce((total, session) => total + session.score, 0) / sessionData.length 
      : 0;
    const totalPoints = sessionData.reduce((total, session) => total + session.points, 0);
    const totalSessions = sessionData.length;

    // Calculate today's study time
    const today = new Date().toISOString().split('T')[0];
    const todaysSessions = sessionData.filter(session => session.date === today);
    const todaysStudyTime = todaysSessions.reduce((total, session) => total + session.duration, 0);

    return {
      totalStudyTime,
      averageScore,
      totalPoints,
      totalSessions,
      todaysStudyTime,
    };
  }, [sessionData]);

  // Validate data consistency
  const validateData = useCallback(() => {
    const stats = getStats();
    const trendData = getTrendData(7);
    
    console.log('📊 Data Validation Report:');
    console.log('- Total Sessions:', stats.totalSessions);
    console.log('- Total Study Time:', stats.totalStudyTime, 'minutes');
    console.log('- Average Score:', stats.averageScore.toFixed(1), '%');
    console.log('- Trend Data Points:', trendData.length);
    console.log('- Last 7 Days Total:', trendData.reduce((sum, day) => sum + day.minutes, 0), 'minutes');
    
    return {
      isValid: stats.totalSessions >= 0 && stats.totalStudyTime >= 0,
      stats,
      trendData,
    };
  }, [getStats, getTrendData]);

  return {
    sessionData,
    isLoading,
    fetchSessionData,
    getTrendData,
    getStats,
    validateData,
  };
}