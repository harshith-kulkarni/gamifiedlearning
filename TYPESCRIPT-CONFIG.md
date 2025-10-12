# 📘 TypeScript Configuration Guide

## Overview

Your gamified learning platform uses a modern TypeScript configuration optimized for Next.js 15, React 19, and development productivity.

## Configuration Details

### `tsconfig.json` Optimizations

#### Target & Module Settings
```json
{
  "target": "ES2022",           // Modern JavaScript features
  "module": "esnext",           // Latest module system
  "moduleResolution": "bundler" // Optimized for bundlers like Webpack
}
```

#### Strict Type Checking
```json
{
  "strict": true,                           // Enable all strict checks
  "forceConsistentCasingInFileNames": true, // Prevent case issues
  "isolatedModules": true,                  // Ensure each file can be transpiled
  "noEmit": true                           // Let Next.js handle compilation
}
```

#### Path Mapping
```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]  // Absolute imports from src/
  }
}
```

## Key Features Enabled

### ✅ Modern JavaScript Support
- **ES2022 target** - Latest language features
- **Top-level await** - Async operations at module level
- **Optional chaining** - Safe property access
- **Nullish coalescing** - Better null/undefined handling

### ✅ Next.js Integration
- **Next.js plugin** - Automatic type generation
- **JSX preserve** - Let Next.js handle JSX transformation
- **Incremental compilation** - Faster rebuilds

### ✅ Development Experience
- **Skip lib check** - Faster compilation
- **Allow JS files** - Gradual TypeScript adoption
- **Source maps disabled** - Faster builds (Next.js handles this)

## File Inclusion Strategy

### Included Files
```json
{
  "include": [
    "next-env.d.ts",      // Next.js type definitions
    "**/*.ts",            // All TypeScript files
    "**/*.tsx",           // All React components
    ".next/types/**/*.ts", // Generated Next.js types
    "scripts/**/*.js"     // Build scripts
  ]
}
```

### Excluded Files
```json
{
  "exclude": [
    "node_modules",       // Dependencies
    ".next",             // Build output
    "out",               // Static export
    "build",             // Alternative build dir
    "dist",              // Distribution files
    "coverage",          // Test coverage
    "**/*.test.ts",      // Test files
    "**/*.test.tsx",     // React test files
    "**/*.spec.ts",      // Spec files
    "**/*.spec.tsx"      // React spec files
  ]
}
```

## Common TypeScript Patterns

### 1. Component Props with Interfaces
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant, size = 'md', onClick, children }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 2. API Response Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

// Usage
const response: ApiResponse<User> = await fetchUser(id);
```

### 3. Custom Hooks with Proper Typing
```typescript
interface UseFlashcardsReturn {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  addFlashcard: (card: Omit<Flashcard, 'id'>) => Promise<void>;
  removeFlashcard: (id: string) => Promise<void>;
}

export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Implementation...

  return {
    flashcards,
    loading,
    error,
    addFlashcard,
    removeFlashcard
  };
}
```

### 4. Utility Types for Better DX
```typescript
// Pick specific properties
type UserProfile = Pick<User, 'id' | 'username' | 'email'>;

// Omit properties for creation
type CreateUserRequest = Omit<User, 'id' | 'createdAt'>;

// Make properties optional
type PartialUser = Partial<User>;

// Make properties required
type RequiredUser = Required<Partial<User>>;
```

## Advanced Configuration Options

### For Larger Projects
```json
{
  "compilerOptions": {
    "composite": true,           // Enable project references
    "tsBuildInfoFile": ".tsbuildinfo", // Cache build info
    "declaration": true,         // Generate .d.ts files
    "declarationMap": true       // Generate declaration maps
  }
}
```

### For Stricter Type Checking
```json
{
  "compilerOptions": {
    "noUnusedLocals": true,           // Error on unused variables
    "noUnusedParameters": true,       // Error on unused parameters
    "exactOptionalPropertyTypes": true, // Strict optional properties
    "noImplicitReturns": true,        // All code paths must return
    "noFallthroughCasesInSwitch": true // Switch cases must break
  }
}
```

## IDE Integration

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### WebStorm/IntelliJ
1. Go to Settings → Languages & Frameworks → TypeScript
2. Enable "TypeScript Language Service"
3. Set "Use TypeScript Service" to "Always"

## Performance Tips

### 1. Use Type-Only Imports
```typescript
// ✅ Good - type-only import
import type { User } from '@/lib/models/user';

// ❌ Avoid - runtime import for types
import { User } from '@/lib/models/user';
```

### 2. Leverage skipLibCheck
Already enabled in your config - skips type checking of declaration files for faster builds.

### 3. Use Project References for Monorepos
```json
{
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/ui" }
  ]
}
```

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors
```bash
# Clear Next.js cache
rm -rf .next

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### 2. Path Mapping Not Working
Ensure `baseUrl` is set and paths are relative to project root:
```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

#### 3. Type Errors in node_modules
`skipLibCheck: true` should handle this, but if issues persist:
```json
{
  "exclude": [
    "node_modules/**/*"
  ]
}
```

## Maintenance

### Regular Tasks
```bash
# Check for type errors
npm run type-check

# Update TypeScript
npm update typescript @types/node @types/react @types/react-dom

# Generate type definitions (if needed)
npx tsc --declaration --emitDeclarationOnly
```

### Monitoring
- **Build times**: Monitor `tsc --noEmit` performance
- **Bundle size**: Check if types affect bundle size
- **Developer experience**: Gather feedback on autocomplete and error messages

## Next Steps

1. **Enable stricter rules** gradually as codebase matures
2. **Add project references** if splitting into packages
3. **Consider type-only imports** for better tree-shaking
4. **Set up automated type checking** in CI/CD pipeline

---

**Your TypeScript configuration is now optimized for modern development! 🚀**