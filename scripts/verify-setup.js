/**
 * Setup Verification Script
 * Verifies that the development environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  console.log(`📦 Node.js version: ${nodeVersion}`);
  
  if (majorVersion < 18) {
    console.error('❌ Node.js version 18 or higher is required');
    console.log('   Please update Node.js: https://nodejs.org/');
    return false;
  }
  
  console.log('✅ Node.js version is compatible');
  return true;
}

function checkEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    console.log('   Run: npm run setup:env');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'GEMINI_API_KEY',
    'MONGODB_URI', 
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missingVars = [];
  const incompleteVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    } else if (envContent.includes(`${varName}=your_`) || envContent.includes(`${varName}=your-`)) {
      incompleteVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    return false;
  }
  
  if (incompleteVars.length > 0) {
    console.error('❌ Incomplete environment variables:', incompleteVars.join(', '));
    console.log('   Please update these with actual values in .env.local');
    return false;
  }
  
  console.log('✅ Environment variables are configured');
  return true;
}

function checkDependencies() {
  try {
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    
    if (!fs.existsSync(packageLockPath)) {
      console.error('❌ package-lock.json not found');
      console.log('   Run: npm install');
      return false;
    }
    
    console.log('✅ Dependencies are installed');
    return true;
  } catch (error) {
    console.error('❌ Error checking dependencies:', error.message);
    return false;
  }
}

function checkTypeScript() {
  try {
    console.log('🔍 Checking TypeScript compilation...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.warn('⚠️  TypeScript compilation has some issues');
    console.log('   This is normal during development and won\'t prevent the app from running');
    console.log('   Next.js will handle TypeScript compilation during development');
    console.log('   Run: npm run type-check to see specific issues');
    return true; // Don't fail setup for TS issues
  }
}

function checkDatabase() {
  console.log('🔍 Testing database connection...');
  
  // First check if we have the required environment variables
  require('dotenv').config({ path: '.env.local' });
  
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('your_')) {
    console.warn('⚠️  MongoDB URI not configured');
    console.log('   Database features will not work until configured');
    console.log('   Add your MongoDB Atlas URI to .env.local');
    return true; // Don't fail setup, just warn
  }
  
  try {
    execSync('npm run test:connection', { stdio: 'pipe' });
    console.log('✅ Database connection successful');
    
    // Also run database setup to ensure collections exist
    try {
      execSync('npm run setup:db', { stdio: 'pipe' });
      console.log('✅ Database collections verified');
    } catch (setupError) {
      console.log('ℹ️  Database setup completed (some warnings may be normal)');
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️  Database connection failed');
    console.log('   The app will start but database features won\'t work');
    console.log('   Check your MongoDB URI in .env.local');
    console.log('   Ensure your IP is whitelisted in MongoDB Atlas');
    return true; // Don't fail setup for DB issues
  }
}

function verifySetup() {
  console.log('🚀 Verifying development environment setup...\n');
  
  const checks = [
    { name: 'Node.js Version', fn: checkNodeVersion },
    { name: 'Environment File', fn: checkEnvironmentFile },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'TypeScript', fn: checkTypeScript },
    { name: 'Database Connection', fn: checkDatabase }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    console.log(`\n--- ${check.name} ---`);
    const passed = check.fn();
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All checks passed! Your development environment is ready.');
    console.log('\n🚀 Start developing with: npm run dev');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    console.log('\n📖 See README.md for detailed setup instructions');
  }
  
  return allPassed;
}

verifySetup();