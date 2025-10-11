#!/usr/bin/env node

/**
 * Dependency Verification Script
 * 
 * This script verifies that the package.json dependencies are consistent
 * and can be installed without conflicts.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying package.json dependencies...\n');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for required fields
  const requiredFields = ['name', 'version', 'dependencies', 'devDependencies'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      console.error(`❌ Missing required field: ${field}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Required fields present');
  
  // Check for common dependency issues
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Check for version conflicts (dependencies that shouldn't be together)
  const conflictingPairs = [
    ['next', 'next-auth'], // These can conflict if versions don't match
    ['@genkit-ai/ai', '@genkit-ai/next'] // These should be compatible versions
  ];
  
  for (const [dep1, dep2] of conflictingPairs) {
    if (dependencies[dep1] && dependencies[dep2]) {
      console.log(`⚠️  Check compatibility: ${dep1} (${dependencies[dep1]}) and ${dep2} (${dependencies[dep2]})`);
    }
  }
  
  // Check for missing peer dependencies
  const peerDependencies = {
    'next': ['react', 'react-dom'],
    'tailwindcss': ['autoprefixer', 'postcss']
  };
  
  for (const [mainDep, peers] of Object.entries(peerDependencies)) {
    if (dependencies[mainDep]) {
      for (const peer of peers) {
        if (!dependencies[peer]) {
          console.log(`⚠️  Missing peer dependency: ${peer} required by ${mainDep}`);
        }
      }
    }
  }
  
  // Check for @genkit-ai dependencies version consistency
  const genkitDeps = Object.keys(dependencies).filter(dep => dep.startsWith('@genkit-ai/'));
  if (genkitDeps.length > 0) {
    const versions = genkitDeps.map(dep => dependencies[dep]);
    const uniqueVersions = [...new Set(versions)];
    if (uniqueVersions.length > 1) {
      console.log('⚠️  Inconsistent @genkit-ai versions found:');
      genkitDeps.forEach(dep => {
        console.log(`   ${dep}: ${dependencies[dep]}`);
      });
    }
  }
  
  console.log('\n✅ Dependency verification completed!');
  console.log('\n📝 To install dependencies:');
  console.log('1. Delete existing package-lock.json and node_modules');
  console.log('2. Run: npm install');
  console.log('3. If issues persist, run: node scripts/clean-install.js');
  
} catch (error) {
  console.error('❌ Dependency verification failed:', error.message);
  process.exit(1);
}