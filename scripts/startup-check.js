/**
 * Startup Check Script
 * Runs before the development server starts to catch common issues
 */

const fs = require('fs');
const path = require('path');

function checkPort() {
  const packageJson = require('../package.json');
  const devScript = packageJson.scripts.dev;
  const portMatch = devScript.match(/-p (\d+)/);
  const devPort = portMatch ? portMatch[1] : '3000';
  
  // Check .env.local for NEXTAUTH_URL
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/NEXTAUTH_URL=.*:(\d+)/);
    const envPort = urlMatch ? urlMatch[1] : null;
    
    if (envPort && envPort !== devPort) {
      console.warn(`⚠️  Port mismatch detected:`);
      console.warn(`   Dev server: ${devPort}`);
      console.warn(`   NEXTAUTH_URL: ${envPort}`);
      console.warn(`   This may cause authentication issues.`);
      console.warn(`   Continuing startup anyway...`);
      return true; // Don't fail startup for port mismatch
    }
  }
  
  console.log(`✅ Port configuration is consistent (${devPort})`);
  return true;
}

function checkCriticalFiles() {
  const criticalFiles = [
    '.env.local',
    'package.json',
    'next.config.js',
    'tsconfig.json'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      console.error(`❌ Critical file missing: ${file}`);
      return false;
    }
  }
  
  console.log('✅ All critical files present');
  return true;
}

function checkEnvironmentVariables() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Environment file missing: .env.local');
    console.log('   Run: npm run setup:env');
    return false;
  }
  
  require('dotenv').config({ path: '.env.local' });
  
  const requiredVars = [
    'GEMINI_API_KEY',
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('   Run: npm run setup:env');
    return false;
  }
  
  // Check for placeholder values
  const placeholderVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return value && (value.includes('your_') || value.includes('your-'));
  });
  
  if (placeholderVars.length > 0) {
    console.warn('⚠️  Placeholder values detected:', placeholderVars.join(', '));
    console.log('   Please update .env.local with actual API keys');
    console.log('   The app will start but some features may not work');
    return true; // Allow startup with warnings
  }
  
  console.log('✅ Environment variables are configured');
  return true;
}

function runStartupCheck() {
  console.log('🔍 Running startup checks...\n');
  
  const checks = [
    checkCriticalFiles,
    checkEnvironmentVariables,
    checkPort
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    if (!check()) {
      allPassed = false;
    }
  }
  
  if (!allPassed) {
    console.log('\n❌ Startup checks failed. Please fix the issues above.');
    console.log('📖 Run "npm run verify-setup" for detailed diagnostics');
    process.exit(1);
  }
  
  console.log('\n✅ All startup checks passed!');
}

// Only run if called directly
if (require.main === module) {
  runStartupCheck();
}

module.exports = { runStartupCheck };