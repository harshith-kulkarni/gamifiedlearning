# 🔧 ESLint Configuration Guide

## Overview

ESLint has been configured for your gamified learning platform using the new flat config format (ESLint 9.x). This setup ensures code quality, consistency, and catches potential issues early.

## Configuration Files

### `eslint.config.js`
- **Modern flat config format** (ESLint 9.x compatible)
- **TypeScript support** with @typescript-eslint
- **React/Next.js rules** for component best practices
- **Separate rules for scripts** (allows console.log in scripts/)

### Scripts Updated
- `npm run lint` - Run ESLint on all files
- `npm run lint:fix` - Auto-fix issues where possible

## Key Rules Configured

### TypeScript Rules
- ✅ **No unused variables** (with underscore prefix exception)
- ⚠️ **Warn on `any` types** (encourage explicit typing)
- ⚠️ **Warn on non-null assertions** (use with caution)
- ❌ **No explicit function return types** (inferred is fine)

### React Rules
- ✅ **React hooks rules** (proper usage)
- ✅ **Exhaustive deps** for useEffect/useCallback
- ❌ **No React import required** (Next.js handles this)

### Code Quality Rules
- ⚠️ **Console statements** (warn, allow warn/error)
- ✅ **Prefer const** over let when not reassigned
- ✅ **No var** (use let/const)
- ✅ **No debugger** statements

### Next.js Specific Rules
- ✅ **No img elements** (use Next.js Image)
- ✅ **Proper Link usage** for pages

## Current Issues Summary

Based on the lint results, here are the main categories of issues:

### 🔴 Critical Errors (197 total)
1. **Unused variables/imports** - 89 errors
2. **React Hooks violations** - 45 errors  
3. **Unescaped entities** - 23 errors
4. **Prefer const** - 15 errors

### 🟡 Warnings (416 total)
1. **Console statements** - 312 warnings
2. **Any types** - 67 warnings
3. **Non-null assertions** - 23 warnings
4. **Missing dependencies** - 14 warnings

## Fixing Strategy

### Phase 1: Critical Errors (Must Fix)
```bash
# Fix unused variables and imports
npm run lint:fix

# Manual fixes needed for:
# - React Hooks violations
# - Unescaped entities in JSX
# - Conditional hook calls
```

### Phase 2: Code Quality (Should Fix)
```bash
# Replace any types with proper interfaces
# Add missing useEffect dependencies
# Fix non-null assertions
```

### Phase 3: Warnings (Nice to Have)
```bash
# Clean up console statements in components
# Improve TypeScript typing
```

## Quick Fixes

### 1. Auto-fixable Issues
```bash
npm run lint:fix
```
This will automatically fix:
- Prefer const over let
- Some unused variables
- Import ordering

### 2. Unused Imports/Variables
Most unused imports can be removed safely. Look for:
```typescript
// Remove unused imports
import { UnusedComponent } from './somewhere';

// Remove unused variables
const unusedVar = someValue; // Remove if not used
```

### 3. React Hooks Issues
Fix conditional hook calls:
```typescript
// ❌ Bad - conditional hooks
if (condition) {
  const value = useCallback(() => {}, []);
}

// ✅ Good - hooks at top level
const value = useCallback(() => {
  if (condition) {
    // logic here
  }
}, [condition]);
```

### 4. Unescaped Entities
Fix JSX quotes and apostrophes:
```typescript
// ❌ Bad
<p>Don't use unescaped quotes</p>

// ✅ Good
<p>Don&apos;t use unescaped quotes</p>
// or
<p>{"Don't use unescaped quotes"}</p>
```

## Configuration Customization

### Allow Console in Development
```javascript
// In eslint.config.js, add to rules:
'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
```

### Disable Specific Rules
```javascript
// Disable for specific files
{
  files: ['src/components/legacy/**/*.tsx'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
}
```

### IDE Integration

#### VS Code
Install the ESLint extension and add to settings.json:
```json
{
  "eslint.experimental.useFlatConfig": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### WebStorm/IntelliJ
1. Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Enable "Automatic ESLint configuration"
3. Check "Run eslint --fix on save"

## Maintenance

### Regular Tasks
```bash
# Weekly: Check for new issues
npm run lint

# Before commits: Fix auto-fixable issues
npm run lint:fix

# Monthly: Review and update rules
npm update eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Monitoring
- **CI/CD**: Add `npm run lint` to your build pipeline
- **Pre-commit hooks**: Use husky to run lint before commits
- **Code reviews**: Include ESLint fixes in PR reviews

## Next Steps

1. **Run the auto-fix**: `npm run lint:fix`
2. **Fix critical errors**: Focus on unused variables and React hooks
3. **Clean up warnings**: Remove console.log from components
4. **Add to CI/CD**: Include linting in your build process
5. **Team training**: Ensure all developers understand the rules

---

**Your codebase will be much cleaner and more maintainable with proper ESLint configuration! 🚀**