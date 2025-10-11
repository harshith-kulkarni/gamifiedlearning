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

- Node.js 18 or higher
- npm (comes with Node.js)
- MongoDB Atlas account
- Google Gemini API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd gamifiedlearning
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   MONGODB_URI="your-mongodb-atlas-connection-string"
   NEXTAUTH_SECRET="your-jwt-secret-key"
   JWT_SECRET="your-jwt-secret-key"
   JWT_EXPIRATION=7d
   NEXTAUTH_URL=http://localhost:9003
   ```

4. **Set up the database:**
   ```bash
   npm run setup:db
   ```

5. **Fix user passwords (for test accounts):**
   ```bash
   node scripts/fix-user-passwords.js
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:9003

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

### Common Issues

1. **Dependency Installation Issues**
   ```bash
   npm run clean-install
   ```

2. **Database Connection Issues**
   - Verify MONGODB_URI in .env.local
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Test connection: `npm run test:connection`

3. **Authentication Issues**
   ```bash
   node scripts/fix-user-passwords.js
   npm run test:login
   ```

4. **Port Conflicts**
   - Change the port in package.json dev script
   - Kill processes using the port:
     ```bash
     netstat -ano | findstr :9003
     taskkill /F /PID <process-id>
     ```

### Debugging Tools

- Browser developer tools for frontend debugging
- MongoDB Atlas dashboard for database monitoring
- Console logging in API routes for backend debugging
- Network tab to inspect API requests

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