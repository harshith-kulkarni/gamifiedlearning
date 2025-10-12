#!/usr/bin/env node

/**
 * Installation Test Script
 * Quick test to verify the app can start without errors
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing application startup...\n');

// Check if basic files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Required file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✅ Required files present');

// Test if Next.js can build
console.log('🔨 Testing Next.js build...');

const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'pipe',
  shell: true
});

let buildOutput = '';
let buildError = '';

buildProcess.stdout.on('data', (data) => {
  buildOutput += data.toString();
});

buildProcess.stderr.on('data', (data) => {
  buildError += data.toString();
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Next.js build successful');
    console.log('\n🎉 Installation test passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure .env.local with your API keys');
    console.log('2. Run: npm run setup:db');
    console.log('3. Run: npm run dev');
  } else {
    console.error('❌ Next.js build failed');
    console.log('\nBuild output:');
    console.log(buildOutput);
    if (buildError) {
      console.log('\nBuild errors:');
      console.log(buildError);
    }
    console.log('\n🔧 Try running: npm run clean-install');
    process.exit(1);
  }
});

// Timeout after 2 minutes
setTimeout(() => {
  console.log('⏰ Build test timed out');
  buildProcess.kill();
  process.exit(1);
}, 120000);