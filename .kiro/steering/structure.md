# Project Structure & Organization

## Root Directory
```
├── .env.example              # Environment variables template
├── .kiro/                    # Kiro AI assistant configuration
├── components.json           # Shadcn/ui component configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── src/                     # Source code
```

## Source Structure (`src/`)

### Application Layer (`src/app/`)
- **App Router**: Next.js 13+ file-based routing
- **layout.tsx**: Root layout with providers and global styles
- **page.tsx**: Route pages following Next.js conventions
- **api/**: API routes for backend functionality
- **actions/**: Server actions for form handling
- **globals.css**: Global styles and CSS variables

### Components (`src/components/`)
- **ui/**: Shadcn/ui components (Button, Input, Dialog, etc.)
- **auth/**: Authentication-related components
- **gamification/**: Badges, progress bars, achievement components
- **study/**: Study session and quiz components
- **layout/**: Navigation, headers, sidebars
- **icons.tsx**: Custom icon components

### Business Logic (`src/lib/`)
- **models/**: TypeScript interfaces and data models
- **services/**: Business logic and external API integrations
- **mongodb.ts**: Database connection and configuration
- **utils.ts**: Utility functions (cn for className merging)
- **auth-middleware.ts**: Authentication middleware
- **pdf-utils.ts**: PDF processing utilities

### State Management (`src/contexts/`)
- **auth-context.tsx**: User authentication state
- **gamification-context.tsx**: Points, badges, achievements
- **study-session-context.tsx**: Study session state

### Custom Hooks (`src/hooks/`)
- **use-toast.ts**: Toast notification hook
- **use-mobile.tsx**: Mobile device detection
- **use-ai-cache.ts**: AI response caching

### AI Integration (`src/ai/`)
- **genkit.ts**: Google Genkit configuration
- **flows/**: AI workflow definitions
- **dev.ts**: Development server for AI testing

## Naming Conventions

### Files & Folders
- **kebab-case**: For file names (`auth-context.tsx`, `study-session.tsx`)
- **PascalCase**: For React components (`AuthProvider`, `StudySession`)
- **camelCase**: For functions and variables (`getUserProgress`, `isLoading`)

### Components
- **Functional Components**: Use arrow functions with TypeScript
- **Props Interfaces**: Named with component name + `Props` suffix
- **Context Providers**: End with `Provider` suffix

### API Routes
- **RESTful**: Follow REST conventions (`/api/auth/login`, `/api/user/progress`)
- **HTTP Methods**: GET for reading, POST for creating, PUT for updating

## Import Patterns

### Path Aliases
```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
```

### Component Imports
- **UI Components**: Import from `@/components/ui/`
- **Business Components**: Import from specific feature folders
- **Utilities**: Import from `@/lib/`
- **Hooks**: Import from `@/hooks/`

## Code Organization Principles

1. **Feature-Based**: Group related components by feature (auth, study, gamification)
2. **Separation of Concerns**: Keep UI, business logic, and data separate
3. **Reusable Components**: Build composable UI components in `/ui/`
4. **Type Safety**: Use TypeScript interfaces for all data structures
5. **Context for State**: Use React Context for global state management