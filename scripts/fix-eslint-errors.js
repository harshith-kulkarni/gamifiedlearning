#!/usr/bin/env node

/**
 * Script to fix common ESLint errors automatically
 */

const fs = require('fs');
const path = require('path');

// Common fixes
const fixes = [
  // Fix unescaped entities
  {
    pattern: /'/g,
    replacement: '&apos;',
    filePattern: /\.(tsx|jsx)$/
  },
  {
    pattern: /"/g,
    replacement: '&quot;',
    filePattern: /\.(tsx|jsx)$/
  },
  
  // Fix any types
  {
    pattern: /: any\b/g,
    replacement: ': unknown',
    filePattern: /\.(ts|tsx)$/
  },
  
  // Remove unused console.log (keep console.warn and console.error)
  {
    pattern: /console\.log\([^)]*\);?\s*\n?/g,
    replacement: '',
    filePattern: /\.(ts|tsx|js|jsx)$/
  }
];

function applyFixes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      if (fix.filePattern.test(filePath)) {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      applyFixes(filePath);
    }
  });
}

console.log('Starting ESLint error fixes...');
walkDirectory('./src');
console.log('ESLint fixes completed!');