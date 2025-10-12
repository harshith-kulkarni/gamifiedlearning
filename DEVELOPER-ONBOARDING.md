# 👋 Developer Onboarding Guide

Welcome to the Gamified Learning Platform! This guide will get you up and running quickly with zero errors.

## 🎯 Goal

By the end of this guide, you'll have:
- ✅ A working development environment
- ✅ The app running on http://localhost:9003
- ✅ Test login working
- ✅ All features functional

## 📋 Prerequisites

Before starting, ensure you have:

```bash
# Check Node.js version (must be 18+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

If any are missing, install them first:
- **Node.js**: https://nodejs.org/ (LTS version)
- **Git**: https://git-scm.com/

## 🚀 Step-by-Step Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd gamified-learning-platform

# Install dependencies
npm install
```

**If you get dependency errors:**
```bash
npm run clean-install
```

### Step 2: Environment Configuration

```bash
# Generate .env.local with secure defaults
npm run setup:env
```

This creates `.env.local` with generated secrets. Now you need to add your API keys.

### Step 3: Get API Keys

#### MongoDB Atlas (Database)
1. Go to https://cloud.mongodb.com/
2. Create a free account/cluster
3. Get your connection string
4. Whitelist your IP address

#### Google Gemini AI (AI Features)
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

### Step 4: Update Environment File

Edit `.env.local` and replace the placeholder values:

```env
# Replace with your actual Gemini API key
GEMINI_API_KEY=AIzaSyC...your_actual_key_here

# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# These are auto-generated, don't change them
NEXTAUTH_SECRET=generated_secret_here
JWT_SECRET=generated_secret_here
NEXTAUTH_URL=http://localhost:9003
```

### Step 5: Initialize Database

```bash
# Set up database collections and test data
npm run setup:db
```

### Step 6: Verify Everything Works

```bash
# Run comprehensive verification
npm run verify-setup
```

This checks:
- Node.js version
- Environment variables
- Dependencies
- TypeScript compilation
- Database connection

### Step 7: Start Development

```bash
# Start the development server
npm run dev
```

Visit **http://localhost:9003** - you should see the login page!

### Step 8: Test Login

Use these test credentials:
- **Email**: `john.doe@example.com`
- **Password**: `password123`

## 🎉 Success Checklist

- [ ] App loads at http://localhost:9003
- [ ] Login page appears without errors
- [ ] Test login works
- [ ] Dashboard shows gamification features
- [ ] No console errors in browser
- [ ] Database connection successful

## 🐛 Common Issues & Solutions

### Issue: `npm install` fails

**Solution 1**: Clean install
```bash
npm run clean-install
```

**Solution 2**: Use legacy peer deps
```bash
npm install --legacy-peer-deps
```

### Issue: Environment variables not working

**Solution**: Recreate environment file
```bash
rm .env.local
npm run setup:env
# Then add your API keys again
```

### Issue: Database connection fails

**Solutions**:
1. Check MongoDB URI format
2. Whitelist your IP in MongoDB Atlas
3. Test connection: `npm run test:connection`

### Issue: Port 9003 already in use

**Solution**: Kill the process
```bash
# Windows
netstat -ano | findstr :9003
taskkill /F /PID <process-id>

# Or change port in package.json
```

### Issue: TypeScript errors

**Solution**: TypeScript errors won't block development
```bash
# Check specific errors
npm run type-check
```

### Issue: Login fails with test users

**Solution**: Reset passwords
```bash
node scripts/fix-user-passwords.js
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Test database connection
npm run test:connection

# Test login functionality
npm run test:login

# Clean install dependencies
npm run clean-install

# Verify entire setup
npm run verify-setup
```

## 📁 Project Structure

```
gamified-learning-platform/
├── src/
│   ├── app/          # Next.js pages (App Router)
│   ├── components/   # React components
│   ├── lib/          # Business logic
│   └── contexts/     # React contexts
├── scripts/          # Setup and utility scripts
├── public/           # Static assets
└── .env.local        # Environment variables (you create this)
```

## 🎮 Features to Explore

Once running, explore these features:
- **Dashboard**: Points, badges, achievements
- **Study Sessions**: AI-powered content generation
- **Quizzes**: Adaptive AI quizzes
- **Progress Tracking**: Detailed analytics
- **Gamification**: Streaks, levels, rewards

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**: Look at terminal output for specific errors
2. **Browser console**: Check for JavaScript errors
3. **Verify setup**: Run `npm run verify-setup` again
4. **Clean slate**: Try `npm run clean-install`
5. **Contact team**: Reach out with specific error messages

## 🎯 Next Steps

Now that you're set up:

1. **Explore the codebase**: Start with `src/app/page.tsx`
2. **Read the docs**: Check `README.md` for detailed information
3. **Make changes**: Try modifying a component
4. **Test features**: Use all the gamification features
5. **Start developing**: You're ready to contribute!

---

**Welcome to the team! 🚀**