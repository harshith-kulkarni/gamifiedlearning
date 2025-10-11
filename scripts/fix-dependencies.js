#!/usr/bin/env node

/**
 * Fix Dependencies Script
 * 
 * This script helps fix dependency issues by cleaning up and reinstalling properly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing dependency issues...\n');

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
      // Try using rimraf first if available
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

  // Fix package.json to ensure react and react-dom are properly specified
  console.log('🔧 Fixing package.json dependencies...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Ensure react and react-dom are in dependencies, not devDependencies
  if (packageJson.devDependencies && packageJson.devDependencies.react) {
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies.react = packageJson.devDependencies.react;
    delete packageJson.devDependencies.react;
  }
  
  if (packageJson.devDependencies && packageJson.devDependencies['react-dom']) {
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['react-dom'] = packageJson.devDependencies['react-dom'];
    delete packageJson.devDependencies['react-dom'];
  }
  
  // Ensure @types/react and @types/react-dom are in devDependencies
  packageJson.devDependencies = packageJson.devDependencies || {};
  if (!packageJson.devDependencies['@types/react']) {
    packageJson.devDependencies['@types/react'] = '^18';
  }
  if (!packageJson.devDependencies['@types/react-dom']) {
    packageJson.devDependencies['@types/react-dom'] = '^18';
  }
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json updated');

  console.log('\n📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n✅ Dependency fix completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Check if the TypeScript errors are resolved');
  
} catch (error) {
  console.error('\n❌ Dependency fix failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you have Node.js and npm installed');
  console.log('2. Check your internet connection');
  console.log('3. Try removing node_modules manually');
  console.log('4. Run: npm install');
  process.exit(1);
}