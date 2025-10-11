# StudyMaster AI - Comprehensive Gamification System

## Overview
This document outlines the complete gamification system implemented in StudyMaster AI, following the specified rules for points, levels, streaks, coins, and power-ups.

## 🎯 Experience & Level System

### Level Calculation
- **Level 1**: 0-99 points
- **Level 2**: 100-249 points (requires 150 more points)
- **Level 3**: 250-449 points (requires 200 more points)
- **Each subsequent level**: +50 points requirement

### Level Up Bonus
- **+100 points** awarded when leveling up
- Automatic level calculation based on total points
- Visual feedback and notifications for level progression

## 💰 Points System

### Study Session Points
- **Session Completed Successfully**: Time in minutes × 5 points
- **Session Ended Early**: -25 points penalty
- **2x Power-up Active**: All study session points multiplied by 2

### Quiz Points
- **Correct Answer**: +5 points each
- **Wrong Answer**: -1 point each
- **Answer Revealed**: -10 points each

### Power-up System
- **Power-up Purchase**: -100 points
- **Level Up Bonus**: +100 points

## 🔥 Streak System

### Daily Streak Logic
- Streak increases when study sessions are created on sequential days
- Tracks last study date in localStorage
- Consecutive day detection:
  - Same day: No change to streak
  - Next day: Increment streak by 1
  - Gap in days: Reset streak to 1

### Streak Benefits
- Visual streak counter in UI
- Streak-based badges and achievements
- Motivation through consecutive day tracking

## 🪙 Coins System (Answer Reveals)

### Coin Usage Rules
- **Maximum 3 coins** per quiz session
- Each coin reveals one correct answer
- **-10 points penalty** per coin used
- Coin counter displayed in quiz interface

### Coin Restrictions
- Cannot reveal answers after using 3 coins
- Visual feedback when coin limit reached
- Confirmation dialog before using coins

## ⚡ Power-ups System

### Available Power-ups
1. **Double Points** (2x multiplier)
   - Duration: 30 minutes
   - Applies to study session points only
   - Cost: 100 points

2. **Time Extension**
   - Adds 10 minutes to study session
   - Instant activation
   - Cost: 100 points

3. **Hint Revealer**
   - Reveals one correct answer per quiz
   - Duration: 30 minutes
   - Cost: 100 points

4. **Focus Mode**
   - Eliminates distractions
   - Duration: 1 hour
   - Cost: 100 points

### Power-up Purchase System
- All power-ups cost **100 points**
- Points deducted immediately upon purchase
- Power-up activated automatically after purchase
- Visual feedback for insufficient points

## 🏆 Implementation Details

### Context Integration
- **GamificationContext**: Manages all gamification state
- **StudySessionContext**: Handles session-specific logic
- Real-time point calculations and updates
- Persistent streak tracking across sessions

### UI Components
- **PowerUpActivator**: Purchase and activate power-ups
- **Timer Components**: Apply multipliers and track completion
- **Quiz Components**: Handle answer reveals and scoring
- **Results Page**: Comprehensive point breakdown

### Database Integration
- Session data saved with point calculations
- User progress synchronized with database
- Achievement and badge tracking
- Quest progress updates

## 📊 Point Calculation Examples

### Example 1: Perfect Study Session
- 30-minute session completed: 30 × 5 = **150 points**
- With 2x power-up active: 150 × 2 = **300 points**
- Quiz: 5 correct, 0 wrong, 0 reveals: 5 × 5 = **25 points**
- **Total: 325 points**

### Example 2: Early End with Penalties
- Session ended early: **-25 points**
- Quiz: 3 correct, 2 wrong, 1 reveal: (3×5) - (2×1) - (1×10) = **3 points**
- **Total: -22 points**

### Example 3: Level Up Scenario
- Current points: 95
- Complete 30-minute session: +150 points = 245 total
- Level up from 1 to 2: +100 bonus points = **345 total points**
- Now at Level 3 (245 + 100 = 345 points)

## 🎮 User Experience Features

### Visual Feedback
- Real-time point updates
- Level progression animations
- Streak counters and flame icons
- Power-up status indicators

### Motivational Elements
- Achievement unlocks
- Badge collections
- Quest progress tracking
- Daily goal visualization

### Gamification Balance
- Rewards consistent study habits
- Penalizes shortcuts and early exits
- Encourages quiz completion
- Provides strategic power-up usage

## 🔧 Technical Implementation

### State Management
- React Context for global state
- localStorage for persistence
- Real-time updates across components
- Optimistic UI updates

### Error Handling
- Graceful degradation for failed saves
- User feedback for all actions
- Validation for point transactions
- Recovery from network issues

This comprehensive gamification system creates an engaging and motivating learning environment that rewards consistent study habits while providing strategic elements through power-ups and careful resource management.