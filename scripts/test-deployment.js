#!/usr/bin/env node

/**
 * Deployment Test Script
 * Tests critical functionality before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StudyMaster AI - Deployment Test Suite\n');

const tests = [
  {
    name: 'Build Test',
    test: () => {
      console.log('Running production build...');
      execSync('npm run build', { stdio: 'inherit' });
      return true;
    }
  },
  {
    name: 'Environment Variables',
    test: () => {
      const envFile = path.join(process.cwd(), '.env.local');
      if (!fs.existsSync(envFile)) {
        throw new Error('.env.local file not found');
      }
      
      const envContent = fs.readFileSync(envFile, 'utf8');
      const requiredVars = ['GEMINI_API_KEY', 'MONGODB_URI', 'JWT_SECRET', 'NEXTAUTH_SECRET'];
      
      for (const varName of requiredVars) {
        if (!envContent.includes(varName)) {
          throw new Error(`Missing required environment variable: ${varName}`);
        }
      }
      
      console.log('✅ All required environment variables found');
      return true;
    }
  },
  {
    name: 'Critical Files Check',
    test: () => {
      const criticalFiles = [
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/signup/page.tsx',
        'src/app/not-found.tsx',
        'src/components/error-boundary.tsx',
        'src/contexts/auth-context.tsx',
        'src/contexts/gamification-context.tsx',
        'src/app/api/auth/login/route.ts',
        'src/app/api/auth/signup/route.ts'
      ];
      
      for (const file of criticalFiles) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Critical file missing: ${file}`);
        }
      }
      
      console.log('✅ All critical files present');
      return true;
    }
  },
  {
    name: 'TypeScript Check',
    test: () => {
      console.log('Running TypeScript type check...');
      execSync('npm run type-check', { stdio: 'inherit' });
      return true;
    }
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    test.test();
    console.log(`✅ ${test.name} - PASSED`);
    passed++;
  } catch (error) {
    console.error(`❌ ${test.name} - FAILED`);
    console.error(`   Error: ${error.message}`);
    failed++;
  }
}

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Ready for deployment.');
  console.log('\n📋 Deployment Checklist:');
  console.log('1. Set production environment variables in Vercel');
  console.log('2. Deploy to Vercel');
  console.log('3. Test signup functionality');
  console.log('4. Test login/logout functionality');
  console.log('5. Test PDF upload and quiz generation');
  console.log('6. Verify no client-side exceptions in browser console');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please fix issues before deployment.');
  process.exit(1);
}