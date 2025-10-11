# Developer Setup Guide

## Overview
This guide provides step-by-step instructions for setting up the Gamified Learning Platform for development.

## Prerequisites
- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Git
- MongoDB Atlas account (credentials provided in codebase)

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gamifiedlearning
```

### 2. Clean Installation
To avoid dependency conflicts, use the clean installation script:

```bash
node scripts/clean-install.js
```

This script will:
- Remove any existing package-lock.json
- Remove node_modules directory
- Install fresh dependencies matching package.json

### 3. Environment Configuration
Create a `.env.local` file in the project root with the following content:

```env
GEMINI_API_KEY="AIzaSyCcuodvxOhaEFrAjeLC0lFH9B2-SIw9QgU"
MONGODB_URI="mongodb+srv://studymaster-user:0uMZo1bshMqTjWNY@studymaster.wzaaliv.mongodb.net/studymaster?retryWrites=true&w=majority&appName=Studymaster"
NEXTAUTH_SECRET="d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8"
JWT_SECRET="d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8"
JWT_EXPIRATION=7d
NEXTAUTH_URL=http://localhost:9002
```

### 4. Database Setup
Initialize the database collections and indexes:

```bash
npm run setup:db
```

### 5. Fix User Passwords
Ensure test users have properly hashed passwords:

```bash
node scripts/fix-user-passwords.js
```

## Development Workflow

### Start Development Server
```bash
npm run dev
```

The application will be available at http://localhost:9003

### Test Credentials
Use these credentials to test the application:

- Email: `john.doe@example.com` / Password: `password123`
- Email: `jane.smith@example.com` / Password: `password123`

## Troubleshooting

### Dependency Issues
If you encounter dependency conflicts:
1. Run `node scripts/clean-install.js`
2. Check that your Node.js version is 18 or higher
3. Clear npm cache: `npm cache clean --force`

### Database Connection Issues
1. Verify MONGODB_URI in .env.local
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Test connection: `npm run test:connection`

### Authentication Issues
1. Run `node scripts/fix-user-passwords.js`
2. Test login: `npm run test:login`
3. Check NEXTAUTH_SECRET and JWT_SECRET in .env.local

## Project Structure
- `src/` - Main application source code
- `scripts/` - Utility scripts for setup and maintenance
- `public/` - Static assets
- `styles/` - Global styles and Tailwind configuration

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup:db` - Set up database collections
- `npm run test:connection` - Test database connection
- `npm run test:login` - Test login functionality

## Contributing
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request