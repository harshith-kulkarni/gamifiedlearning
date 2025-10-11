# StudyMaster AI - Developer Setup Guide

## 🚀 Quick Start for New Developers

### Prerequisites
- Node.js 18+ installed
- Git access to the repository
- MongoDB Atlas account access (provided by team lead)

### 1. Clone and Install
```bash
git clone [repository-url]
cd studymaster-ai
npm install
```

### 2. Environment Setup

**Copy the environment template:**
```bash
cp .env.example .env.local
```

**Update `.env.local` with your credentials:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://[your-username]:[your-password]@studymaster.wzaaliv.mongodb.net/studymaster?retryWrites=true&w=majority&appName=Studymaster
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Access

**Request access from team lead:**
- Your team lead will create a MongoDB Atlas database user for you
- You'll receive your unique username and password
- Replace `[your-username]` and `[your-password]` in the MONGODB_URI

**Alternative - Shared Development Database:**
- Use the shared development credentials provided by team lead
- All developers can use the same development database user

### 4. API Keys Setup

**Google Gemini API Key:**
- Get your own API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Or use the shared development key provided by team lead

**NextAuth Secret:**
- Generate a random secret: `openssl rand -base64 32`
- Or use the shared development secret

### 5. Run the Application

```bash
# Start development server
npm run dev

# Start Genkit AI server (in separate terminal)
npm run genkit:dev
```

### 6. Verify Setup

1. **Open** http://localhost:3000
2. **Create an account** or login
3. **Start a study session** to test database connectivity
4. **Check console** for any connection errors

## 🔧 Troubleshooting

### Database Connection Issues
- Verify your IP is whitelisted in MongoDB Atlas Network Access
- Check that your username/password are correct
- Ensure the database name is `studymaster`

### API Key Issues
- Verify Gemini API key is valid and has quota
- Check that the key has proper permissions

### Port Conflicts
- Change NEXTAUTH_URL port if 3000 is in use
- Update both .env.local and package.json dev script

## 🤝 Team Collaboration

### Database Collections
- **users**: User accounts and basic info
- **userstats**: Gamification data (points, level, streak, badges)
- **tasks**: Study sessions and completion data
- **quiz**: Quiz results and scores

### Development Best Practices
- Never commit `.env.local` to git
- Use separate database users for each developer
- Test database operations before pushing code
- Coordinate schema changes with team lead

## 📞 Need Help?
Contact the team lead for:
- MongoDB Atlas access
- API key sharing
- Environment configuration
- Database schema questions