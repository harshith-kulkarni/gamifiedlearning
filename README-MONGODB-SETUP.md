# StudyMaster AI - MongoDB Integration

This project now includes full MongoDB integration with user authentication, progress tracking, and persistent data storage.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up MongoDB** (Choose one option)
   - **Local MongoDB**: Follow instructions in `setup-mongodb.md`
   - **MongoDB Atlas**: Create a free cluster at https://mongodb.com/atlas
   - **Docker**: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

3. **Configure Environment Variables**
   Copy `.env.example` to `.env` and update:
   ```env
   MONGODB_URI="mongodb://localhost:27017/studymaster"
   NEXTAUTH_SECRET="your-super-secret-key-change-this"
   NEXTAUTH_URL="http://localhost:9002"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

## 🔐 Authentication Features

- **User Registration**: Create new accounts with username, email, and password
- **User Login**: Secure authentication with JWT tokens
- **Protected Routes**: Dashboard and study features require authentication
- **Session Management**: Automatic token verification and refresh

## 📊 Data Persistence

### User Progress Tracking
- **Points & Levels**: Automatically calculated and stored
- **Study Streaks**: Daily study tracking with streak maintenance
- **Badges & Achievements**: Unlocked based on user activities
- **Quests**: Progress tracking for various study goals

### Study Sessions
- **Session History**: Complete record of all study sessions
- **Time Tracking**: Duration, scores, and points for each session
- **Quiz Results**: Detailed answer tracking and performance metrics
- **Analytics**: Visual charts showing progress over time

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date,
  progress: {
    level: Number,
    points: Number,
    streak: Number,
    lastStudyDate: Date,
    totalStudyTime: Number,
    dailyGoal: Number,
    badges: [Badge],
    quests: [Quest],
    achievements: [Achievement],
    studySessions: [StudySession]
  }
}
```

## 🎮 Gamification Features

### Badges
- First Quiz, Week Streak, Centurion (100 points)
- Perfect Score, Early Bird, Night Owl
- Speed Demon, Scholar (10 quizzes)

### Quests
- Hour Master (60 minutes study)
- Quiz Master (5 quizzes)
- Chat Champion (10 AI questions)
- Monthly Streak (30 days)

### Achievements
- First Session, Marathon Study (2 hours)
- Consistent Week, Quiz Expert (90%+ on 5 quizzes)

## 📈 Analytics Dashboard

The analytics page now shows:
- **Study Time Plots**: Line charts showing daily study duration
- **Points Earned**: Bar charts of points per session
- **Performance Metrics**: Scores, streaks, and achievements
- **Session History**: Detailed list of recent study activities

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/verify` - Token verification

### User Data
- `GET /api/user/progress` - Get user progress
- `PUT /api/user/progress` - Update user progress
- `POST /api/user/study-session` - Add study session
- `GET /api/user/study-session` - Get study sessions

## 🛠️ Development

### Database Operations
The app automatically handles:
- User creation and authentication
- Progress synchronization
- Badge and achievement unlocking
- Quest progress tracking
- Study session recording

### Error Handling
- Network errors are gracefully handled
- Authentication failures redirect to login
- Database connection issues are logged
- User feedback for all error states

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Protected API routes
- Input validation and sanitization
- Secure session management

## 📱 User Experience

- **Persistent Login**: Users stay logged in across browser sessions
- **Real-time Updates**: Progress updates immediately in the UI
- **Offline Resilience**: Local state management with database sync
- **Responsive Design**: Works on all device sizes

## 🚨 Important Notes

1. **Change Default Secrets**: Update `NEXTAUTH_SECRET` in production
2. **Database Security**: Use MongoDB authentication in production
3. **HTTPS**: Enable HTTPS for production deployments
4. **Backup Strategy**: Implement regular database backups

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`
- Verify network connectivity

### Authentication Problems
- Clear browser localStorage
- Check JWT secret configuration
- Verify API endpoint accessibility

### Data Not Persisting
- Check MongoDB connection logs
- Verify user authentication
- Ensure API routes are accessible

For more detailed setup instructions, see `setup-mongodb.md`.