# Complete Setup Guide for New Developers

This guide ensures you can run the Gamified Learning Platform successfully on any machine.

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd gamifiedlearning

# 2. Automated setup
npm run setup

# 3. Get your API keys (see below)
# Edit .env.local with your actual API keys

# 4. Verify everything works
npm run verify-setup

# 5. Start developing
npm run dev
```

## 🔑 Required API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add to `.env.local`:
   ```
   GEMINI_API_KEY=AIzaSy...your-key-here
   ```

### MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string from "Connect" → "Connect your application"
4. Add to `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/studymaster?retryWrites=true&w=majority&appName=Studymaster
   ```

## 🛠️ Manual Setup (if automated setup fails)

### Step 1: Prerequisites
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **Git**: Download from [git-scm.com](https://git-scm.com/)

### Step 2: Clone and Install
```bash
git clone <repository-url>
cd gamifiedlearning
npm install
```

### Step 3: Environment Setup
```bash
# Generate .env.local with secure secrets
npm run setup:env

# Edit .env.local and add your API keys
# (See "Required API Keys" section above)
```

### Step 4: Database Setup
```bash
npm run setup:db
```

### Step 5: Verification
```bash
npm run verify-setup
```

## 🐛 Troubleshooting

### Common Issues

#### "Port already in use"
```bash
# Kill process on port 9003
npx kill-port 9003
# Or change port in package.json dev script
```

#### "Module not found" errors
```bash
# Clean reinstall
npm run clean-install
```

#### "Database connection failed"
1. Check MONGODB_URI in `.env.local`
2. Ensure IP is whitelisted in MongoDB Atlas
3. Test connection: `npm run test:connection`

#### "Authentication failed"
1. Verify API keys in `.env.local`
2. Check secrets are properly generated
3. Test login: `npm run test:login`

#### TypeScript errors
```bash
# Check for type errors
npm run type-check
```

### Environment Issues

#### Different behavior on different machines
- Ensure Node.js version is 18+
- Use `npm run clean-install` for fresh dependencies
- Check that `.env.local` has all required variables

#### Performance issues
- The app now uses efficient 5-minute refresh intervals
- Manual refresh buttons are available for immediate updates
- No more excessive 30-second auto-refreshes

## 📋 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with checks |
| `npm run build` | Build for production |
| `npm run setup` | Complete automated setup |
| `npm run setup:env` | Generate environment file |
| `npm run setup:db` | Initialize database |
| `npm run verify-setup` | Verify all configuration |
| `npm run clean-install` | Clean dependency installation |
| `npm run type-check` | Check TypeScript errors |
| `npm run test:connection` | Test database connection |

## 🔒 Security Notes

- Never commit `.env.local` to version control
- API keys are automatically generated securely
- Use environment variables for all sensitive data
- MongoDB connection uses encrypted connections

## 📊 Performance Optimizations

- Reduced auto-refresh from 30 seconds to 5 minutes
- Intelligent caching prevents excessive API calls
- Manual refresh buttons for immediate updates
- Debounced sync operations (2-second delay)

## ✅ Success Indicators

When everything is working correctly, you should see:
- ✅ All startup checks passed
- ✅ Database connection successful
- ✅ TypeScript compilation successful
- 🚀 Development server running on http://localhost:9003

## 🆘 Getting Help

If you're still having issues:
1. Run `npm run verify-setup` for detailed diagnostics
2. Check the console for specific error messages
3. Ensure all prerequisites are installed correctly
4. Try the manual setup process step by step

## 🎯 Next Steps

Once setup is complete:
1. Visit http://localhost:9003
2. Use test credentials:
   - Email: `john.doe@example.com`
   - Password: `password123`
3. Explore the dashboard and gamification features
4. Start developing new features!