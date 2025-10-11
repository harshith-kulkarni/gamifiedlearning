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
      // Try to remove with rimraf first if available
      execSync('npx rimraf node_modules', { stdio: 'inherit' });
    } catch (rimrafError) {
      console.log('⚠️  rimraf not available, trying alternative methods...');
      try {
        // Try using Windows commands
        execSync('cmd /c "rmdir /s /q node_modules"', { stdio: 'inherit' });
      } catch (windowsError) {
        console.log('⚠️  Could not remove node_modules automatically. Please remove it manually.');
      }
    }
    
    if (!fs.existsSync('node_modules')) {
      console.log('✅ node_modules directory removed');
    } else {
      console.log('⚠️  node_modules directory may still exist. Please remove it manually if needed.');
    }
  }

  console.log('\n📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n✅ Clean installation completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up your .env.local file with database credentials');
  console.log('2. Run: npm run setup:db');
  console.log('3. Run: npm run dev');
  console.log('4. Test login with: john.doe@example.com / password123');
  
} catch (error) {
  console.error('\n❌ Installation failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you have Node.js and npm installed');
  console.log('2. Check your internet connection');
  console.log('3. Try removing node_modules manually');
  console.log('4. Run: npm install');
  process.exit(1);
}