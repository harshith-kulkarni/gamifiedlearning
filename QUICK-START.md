# 🚀 Quick Start Guide

Get the Gamified Learning Platform running in under 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- **Node.js 18+** (`node --version`)
- **npm** (`npm --version`)
- **Git** (`git --version`)

## 1. Clone & Install

```bash
git clone <repository-url>
cd gamified-learning-platform
npm install
```

## 2. Environment Setup

```bash
# Generate environment file with secure defaults
npm run setup:env
```

**Important**: Edit `.env.local` and add your API keys:

```env
# Required: Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Required: Get from MongoDB Atlas dashboard
MONGODB_URI=your_mongodb_connection_string_here
```

## 3. Database Setup

```bash
# Initialize database collections and test data
npm run setup:db
```

## 4. Verify Installation

```bash
# Run comprehensive setup verification
npm run verify-setup
```

## 5. Start Development

```bash
npm run dev
```

Visit **http://localhost:9003** to see your application!

## Test Login Credentials

- Email: `john.doe@example.com` / Password: `password123`
- Email: `jane.smith@example.com` / Password: `password123`

## Troubleshooting

### Installation Issues
```bash
# Clean install if you encounter dependency issues
npm run clean-install
```

### Database Issues
```bash
# Test database connection
npm run test:connection

# Fix user passwords if login fails
node scripts/fix-user-passwords.js
```

### Port Conflicts
If port 9003 is busy, edit `package.json` and change the port in the dev script.

## Next Steps

1. **Explore the Dashboard**: Login and check out the gamification features
2. **Try AI Features**: Generate study content and take AI-powered quizzes
3. **Check Progress**: View your points, badges, and achievements
4. **Read Documentation**: See `README.md` for detailed information

## Need Help?

- Check `TROUBLESHOOTING.md` for common issues
- Review `DEVELOPER-SETUP.md` for detailed setup information
- Contact the development team for support

---

**Happy Learning! 🎓**