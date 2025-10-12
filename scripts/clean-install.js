#!/usr/bin/env node

/**
 * Clean Install Script
 * 
 * This script helps developers get a clean installation of the project
 * by removing problematic files and reinstalling dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up project for fresh installation...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found. Please run this script from the project root directory.');
    process.exit(1);
  }

  // Remove package-lock.json if it exists
  if (fs.existsSync('package-lock.json')) {
    console.log('🗑️  Removing package-lock.json...');
    fs.unlinkSync('package-lock.json');
    console.log('✅ package-lock.json removed');
  }

  // Try to remove node_modules if it exists
  if (fs.existsSync('node_modules')) {
    console.log('🗑️  Removing node_modules directory...');
    try {
      // Use cross-platform removal
      if (process.platform === 'win32') {
        execSync('rmdir /s /q node_modules', { stdio: 'inherit', shell: true });
      } else {
        execSync('rm -rf node_modules', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('⚠️  Could not remove node_modules automatically. Please remove it manually.');
    }
    
    if (!fs.existsSync('node_modules')) {
      console.log('✅ node_modules directory removed');
    }
  }

  // Clear npm cache to prevent issues
  console.log('🧹 Clearing npm cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ npm cache cleared');
  } catch (error) {
    console.log('⚠️  Could not clear npm cache, continuing...');
  }

  console.log('\n📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n✅ Clean installation completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run setup:env (to create .env.local)');
  console.log('2. Edit .env.local with your API keys');
  console.log('3. Run: npm run setup:db (to initialize database)');
  console.log('4. Run: npm run dev (to start development server)');
  console.log('5. Visit: http://localhost:9003');
  
} catch (error) {
  console.error('\n❌ Installation failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Ensure Node.js 18+ is installed: node --version');
  console.log('2. Check npm is working: npm --version');
  console.log('3. Check internet connection');
  console.log('4. Try: npm install --legacy-peer-deps');
  console.log('5. See TROUBLESHOOTING.md for more help');
  process.exit(1);
}