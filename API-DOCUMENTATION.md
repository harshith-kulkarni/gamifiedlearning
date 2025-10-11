# StudyMaster AI - API Documentation

## Overview

StudyMaster AI provides a RESTful API for user authentication, progress tracking, and study session management. All endpoints return JSON responses and use JWT tokens for authentication.

**Base URL**: `http://localhost:3000/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire after 7 days and are returned upon successful login/signup.

---

## 🔐 Authentication Endpoints

### POST `/auth/login`

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "_id": "68c26bd41e0e2cf8deeb08fd",
    "username": "john_doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-11T15:30:00.000Z",
    "progress": {
      "level": 5,
      "points": 1250,
      "streak": 7,
      "totalStudyTime": 3600,
      "lastStudyDate": "2025-01-11T15:30:00.000Z",
      "dailyGoal": 60,
      "badges": [...],
      "quests": [...],
      "achievements": [...],
      "studySessions": [...]
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Internal server error

**Example Usage:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'password123'
  })
});

const data = await response.json();
if (response.ok) {
  localStorage.setItem('token', data.token);
  console.log('Login successful:', data.user);
}
```

---

### POST `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "_id": "68c26bd41e0e2cf8deeb08fe",
    "username": "new_user",
    "email": "newuser@example.com",
    "createdAt": "2025-01-11T16:00:00.000Z",
    "updatedAt": "2025-01-11T16:00:00.000Z",
    "progress": {
      "level": 1,
      "points": 0,
      "streak": 0,
      "totalStudyTime": 0,
      "dailyGoal": 30,
      "badges": [...],
      "quests": [...],
      "achievements": [...],
      "studySessions": []
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Missing required fields or password too short (< 8 characters)
- `409`: User with email or username already exists
- `500`: Internal server error

**Validation Rules:**
- Username: Required, 3-50 characters
- Email: Required, valid email format
- Password: Required, minimum 8 characters

---

### GET `/auth/verify`

Verify a JWT token and get current user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "user": {
    "_id": "68c26bd41e0e2cf8deeb08fd",
    "username": "john_doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-11T15:30:00.000Z",
    "progress": {
      "level": 5,
      "points": 1250,
      "streak": 7,
      "totalStudyTime": 3600,
      "lastStudyDate": "2025-01-11T15:30:00.000Z",
      "dailyGoal": 60,
      "badges": [...],
      "quests": [...],
      "achievements": [...],
      "studySessions": [...]
    }
  }
}
```

**Error Responses:**
- `401`: No token provided or invalid token
- `404`: User not found
- `500`: Internal server error

**Example Usage:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/auth/verify', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const data = await response.json();
  console.log('Current user:', data.user);
} else {
  // Token invalid, redirect to login
  window.location.href = '/login';
}
```

---

## 👤 User Management Endpoints

### GET `/user/progress`

Get the current user's progress data.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "progress": {
    "level": 5,
    "points": 1250,
    "streak": 7,
    "totalStudyTime": 3600,
    "lastStudyDate": "2025-01-11T15:30:00.000Z",
    "dailyGoal": 60,
    "badges": [
      {
        "id": "first-quiz",
        "name": "First Quiz",
        "description": "Complete your first quiz",
        "icon": "🎓",
        "earned": true,
        "earnedAt": "2025-01-10T11:00:00.000Z",
        "rarity": "common"
      }
    ],
    "quests": [
      {
        "id": "study-60",
        "name": "Hour Master",
        "description": "Study for 60 minutes total",
        "icon": "⏱️",
        "progress": 45,
        "target": 60,
        "reward": 50,
        "completed": false,
        "category": "study"
      }
    ],
    "achievements": [...],
    "studySessions": [...]
  }
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `404`: User not found

---

### PUT `/user/progress`

Update the current user's progress data.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "level": 6,
  "points": 1350,
  "streak": 8,
  "totalStudyTime": 4200,
  "dailyGoal": 90
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)

**Note:** Only provided fields will be updated. Omitted fields remain unchanged.

---

## 📚 Study Session Endpoints

### POST `/user/study-session`

Add a new study session for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "session_1705000000000",
  "taskName": "Machine Learning Fundamentals",
  "duration": 45,
  "score": 85,
  "points": 100,
  "quizAnswers": [
    {
      "questionIndex": 0,
      "answer": "Supervised Learning",
      "correct": true
    },
    {
      "questionIndex": 1,
      "answer": "Neural Networks",
      "correct": false
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "session": {
    "id": "session_1705000000000",
    "taskName": "Machine Learning Fundamentals",
    "duration": 45,
    "score": 85,
    "points": 100,
    "completedAt": "2025-01-11T16:30:00.000Z",
    "quizAnswers": [...]
  }
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)

**Automatic Features:**
This endpoint automatically:
- Updates user progress (points, level, streak, study time)
- Checks and awards badges based on performance
- Updates quest progress
- Checks and unlocks achievements

**Badge/Achievement Triggers:**
- First session → "First Session" achievement
- 2+ hours in one session → "Marathon Study" achievement  
- 100% score → "Perfect Score" badge
- First quiz → "First Quiz" badge
- 100+ total points → "Centurion" badge
- 10+ sessions → "Scholar" badge
- 7+ day streak → "Week Streak" badge

---

### GET `/user/study-session`

Get all study sessions for the current user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "sessions": [
    {
      "date": "2025-01-11",
      "duration": 45,
      "score": 85,
      "points": 100
    },
    {
      "date": "2025-01-10",
      "duration": 30,
      "score": 92,
      "points": 120
    }
  ]
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)

**Data Format:**
- `date`: ISO date string (YYYY-MM-DD)
- `duration`: Minutes spent studying
- `score`: Quiz score percentage (0-100)
- `points`: Points earned from the session

---

## 📊 Data Models

### User Object
```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  progress: UserProgress;
}
```

### User Progress Object
```typescript
interface UserProgress {
  level: number;           // Current level (calculated from points)
  points: number;          // Total points earned
  streak: number;          // Consecutive days studied
  totalStudyTime: number;  // Total minutes studied
  lastStudyDate?: string;  // Last study session date
  dailyGoal: number;       // Daily study goal in minutes
  badges: Badge[];         // Earned and available badges
  quests: Quest[];         // Active and completed quests
  achievements: Achievement[]; // Earned achievements
  studySessions: StudySession[]; // Recent study sessions
}
```

### Study Session Object
```typescript
interface StudySession {
  id: string;
  taskName: string;
  duration: number;        // Minutes
  score: number;           // Percentage (0-100)
  points: number;          // Points earned
  completedAt: string;     // ISO date string
  quizAnswers?: QuizAnswer[];
}
```

### Badge Object
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;            // Emoji or icon identifier
  earned: boolean;
  earnedAt?: string;       // ISO date string
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
```

### Quest Object
```typescript
interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;        // Current progress
  target: number;          // Target to complete
  reward: number;          // Points reward
  completed: boolean;
  completedAt?: string;    // ISO date string
  category: string;
}
```

---

## 🔧 Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message"
}
```

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (missing/invalid parameters)
- **401**: Unauthorized (invalid/missing token)
- **404**: Not Found (user/resource doesn't exist)
- **409**: Conflict (duplicate email/username)
- **500**: Internal Server Error

### Error Examples

**Missing Authentication:**
```json
{
  "error": "No token provided"
}
```

**Invalid Credentials:**
```json
{
  "error": "Invalid email or password"
}
```

**Validation Error:**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

**Duplicate User:**
```json
{
  "error": "User with this email or username already exists"
}
```

---

## 🚀 Quick Start Examples

### Complete Authentication Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// 2. Store token
localStorage.setItem('authToken', token);

// 3. Make authenticated requests
const progressResponse = await fetch('/api/user/progress', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const progressData = await progressResponse.json();
console.log('User progress:', progressData.progress);
```

### Add Study Session

```javascript
const token = localStorage.getItem('authToken');

const sessionResponse = await fetch('/api/user/study-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    taskName: 'React Fundamentals',
    duration: 60,
    score: 95,
    points: 150,
    quizAnswers: [
      { questionIndex: 0, answer: 'Virtual DOM', correct: true },
      { questionIndex: 1, answer: 'State', correct: true }
    ]
  })
});

const sessionData = await sessionResponse.json();
if (sessionData.success) {
  console.log('Session added successfully!');
  // Refresh user progress to see updated points/level
}
```

### Check Authentication Status

```javascript
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    } else {
      // Token invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login';
  }
}
```

---

## 🧪 Testing Credentials

For development and testing, use these pre-configured accounts:

**User 1:**
- Email: `john.doe@example.com`
- Password: `password123`
- Level: 5, Points: 1250

**User 2:**
- Email: `jane.smith@example.com`
- Password: `password123`
- Level: 3, Points: 750

---

## 📝 Notes for Developers

1. **JWT Tokens**: Expire after 7 days. Implement refresh logic or re-authentication.

2. **Rate Limiting**: Consider implementing rate limiting for production use.

3. **CORS**: Configure CORS settings for cross-origin requests in production.

4. **Validation**: All inputs are validated server-side. Client-side validation is recommended for UX.

5. **Database**: Uses MongoDB Atlas with separate collections for users, sessions, quizzes, etc.

6. **Gamification**: Badge/achievement logic runs automatically on session creation.

7. **Progress Calculation**: 
   - Level = floor(points / 100) + 1
   - Streak resets if more than 1 day gap between sessions

8. **Error Logging**: All errors are logged server-side for debugging.

---

## 🔗 Related Documentation

- [Database Schema](./DATABASE-MIGRATION-COMPLETE.md)
- [Login Fix Summary](./LOGIN-FIX-SUMMARY.md)
- [MongoDB Atlas Setup](./MONGODB-ATLAS-SETUP.md)
- [Project Structure](./README-MONGODB-SETUP.md)