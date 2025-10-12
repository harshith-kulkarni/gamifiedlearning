# Gamified Learning Platform

A modern, AI-powered learning platform that transforms education through gamification and personalized learning experiences.

## 🚀 Overview

This platform combines cutting-edge AI technologies with gamification mechanics to create an engaging and effective learning environment. Built with Next.js 15, MongoDB Atlas, and Google's Genkit AI framework, it provides:

- **AI-Powered Learning**: Personalized content generation and adaptive quizzes
- **Gamification System**: Points, badges, streaks, and achievements to motivate learners
- **Progress Tracking**: Detailed analytics and performance insights
- **Custom Authentication**: Secure JWT-based authentication system

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB Atlas
- **AI**: Google Genkit AI, Gemini API
- **Authentication**: Custom JWT-based system
- **Database**: MongoDB Atlas with schema validation
- **UI Components**: Radix UI, Headless UI

## 📁 Project Structure

```
gamifiedlearning/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers
│   ├── lib/                 # Business logic and services
│   │   ├── models/          # Data models and interfaces
│   │   ├── services/        # Database and external services
│   │   └── utils/           # Utility functions
│   └── ai/                  # AI flows and prompts
├── scripts/                 # Utility and setup scripts
├── public/                  # Static assets
└── styles/                  # Global styles
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18 or higher** (Check with `node --version`)
- **npm** (comes with Node.js)
- **Git** for version control
- **MongoDB Atlas account** (free tier available)
- **Google Gemini API key** (free tier available)

### Quick Setup (Recommended)

**New developers start here!** This setup ensures zero errors:

```bash
# 1. Clone the repository
git clone <repository-url>
cd gamified-learning-platform

# 2. Install dependencies
npm install

# 3. Set up environment (creates .env.local)
npm run setup:env

# 4. Edit .env.local with your API keys (see below)

# 5. Initialize database
npm run setup:db

# 6. Verify everything works
npm run verify-setup

# 7. Start development
npm run dev
```

**Visit http://localhost:9003 to see your app!**

### Required API Keys

Edit `.env.local` and add these keys:

```env
# Get from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_api_key

# Get from: MongoDB Atlas dashboard
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Troubleshooting Installation

If you encounter any issues:

```bash
# Clean installation (removes node_modules and reinstalls)
npm run clean-install

# If that fails, try legacy peer deps
npm install --legacy-peer-deps

# Run comprehensive diagnostics
npm run verify-setup
```

**Note**: All major installation issues have been resolved. The setup should work smoothly for new developers.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at **http://localhost:9003**

### Environment Variables

Required variables in `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google AI API key | `AIzaSy...` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `NEXTAUTH_SECRET` | JWT secret (auto-generated) | `d8e8f8a8...` |
| `JWT_SECRET` | JWT secret (auto-generated) | `d8e8f8a8...` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:9003` |

### Test Credentials

Use these credentials to test the application:
- Email: `john.doe@example.com` / Password: `password123`
- Email: `jane.smith@example.com` / Password: `password123`

## 🎮 Gamification Features

### Points System
- Earn points for completing study sessions
- Bonus points for perfect quiz scores
- Streak bonuses for consecutive study days

### Badges
- Achievement badges for milestones
- Rarity-based badges (common, rare, epic, legendary)
- Automatic badge unlocking based on progress

### Quests
- Progressive challenges with rewards
- Category-based quests (study time, quizzes, etc.)
- Track progress toward goals

### Achievements
- Special accomplishments with point rewards
- Milestone-based recognition
- Personalized achievement tracking

## 🤖 AI Features

### Content Generation
- AI-powered study material creation
- Adaptive content based on learning progress
- Personalized learning paths

### Quiz Generation
- Automatic quiz creation from study materials
- Difficulty-adjusted questions
- Detailed explanations for answers

### Intelligent Tutoring
- AI-powered study assistance
- Personalized feedback and recommendations
- Adaptive learning algorithms

## 🗄️ Database Schema

### Users Collection
- User authentication and profile information
- Personal preferences and settings

### UserStats Collection
- Gamification progress and achievements
- Points, levels, streaks, and badges
- Study statistics and performance data

### Tasks Collection
- Study session tracking
- Session duration and points earned
- Completion status and timestamps

### Quiz Collection
- Quiz questions and answers
- User responses and scores
- Performance analytics

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup:db` - Set up database collections and indexes
- `npm run test:connection` - Test database connection
- `npm run test:login` - Test login functionality
- `npm run clean-install` - Clean installation of dependencies

## 🛡️ Security

### Authentication
- Custom JWT-based authentication system
- Secure password hashing with bcrypt
- Token expiration and refresh mechanisms

### Data Protection
- MongoDB Atlas encryption at rest
- Secure API endpoints with token validation
- Input validation and sanitization

## 📊 Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization with Next.js Image component
- Client-side caching with React Context

### Backend
- Database indexing for fast queries
- Connection pooling for MongoDB
- Efficient API route handling

### Caching
- localStorage for client-side data persistence
- MongoDB aggregation pipelines for complex queries
- In-memory caching for frequently accessed data

## 🐛 Troubleshooting

### Installation Issues

**Problem**: `npm install` fails with dependency conflicts
```bash
# Solution 1: Clean install
npm run clean-install

# Solution 2: Use legacy peer deps
npm install --legacy-peer-deps

# Solution 3: Clear cache and retry
npm cache clean --force
npm install
```

**Problem**: TypeScript compilation errors during install
```bash
# The postinstall script has been removed to prevent this
# If you see TS errors, they won't block installation anymore
```

### Environment Issues

**Problem**: Missing .env.local file
```bash
npm run setup:env
# Then edit .env.local with your API keys
```

**Problem**: "Invalid API key" errors
- Verify GEMINI_API_KEY in .env.local
- Get a new key from https://makersuite.google.com/app/apikey
- Ensure no extra spaces or quotes around the key

### Database Issues

**Problem**: Cannot connect to MongoDB
```bash
# Test your connection
npm run test:connection

# Common fixes:
# 1. Check MONGODB_URI format in .env.local
# 2. Whitelist your IP in MongoDB Atlas
# 3. Ensure database user has proper permissions
```

**Problem**: Authentication fails with test users
```bash
# Reset test user passwords
node scripts/fix-user-passwords.js
npm run test:login
```

### Development Server Issues

**Problem**: Port 9003 is already in use
```bash
# Find and kill the process (Windows)
netstat -ano | findstr :9003
taskkill /F /PID <process-id>

# Or change the port in package.json dev script
```

**Problem**: App starts but shows errors
```bash
# Run comprehensive diagnostics
npm run verify-setup
```

### Quick Fixes

- **Clear browser cache** if you see old content
- **Restart your terminal** after environment changes
- **Check Node.js version**: Must be 18 or higher
- **Disable antivirus** temporarily if file operations fail

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 📞 Support

For issues and questions, please contact the development team.