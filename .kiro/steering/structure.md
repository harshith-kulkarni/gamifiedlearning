# Project Structure & Architecture

## Directory Organization

```
gamified-learning-platform/
├── src/
│   ├── app/                 # Next.js App Router (pages & layouts)
│   │   ├── api/            # API routes for backend functionality
│   │   ├── dashboard/      # Dashboard pages and components
│   │   ├── signup/         # Authentication pages
│   │   └── actions/        # Server actions
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication-related components
│   │   ├── gamification/  # Gamification UI (badges, progress, etc.)
│   │   ├── layout/        # Layout components (header, sidebar, etc.)
│   │   ├── study/         # Study session components
│   │   └── ui/            # Base UI components (shadcn/ui)
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Business logic and utilities
│   │   ├── models/        # TypeScript interfaces and data models
│   │   ├── services/      # Database and external API services
│   │   └── utils/         # Utility functions
│   └── ai/                # AI flows and Genkit configuration
├── scripts/               # Setup and maintenance scripts
└── public/               # Static assets
```

## Architecture Patterns

### Component Organization
- **UI Components**: Located in `src/components/ui/` (shadcn/ui based)
- **Feature Components**: Organized by domain (`auth/`, `gamification/`, `study/`)
- **Layout Components**: Shared layout elements in `src/components/layout/`
- **Page Components**: App Router pages in `src/app/`

### State Management
- **Global State**: React Context API (`src/contexts/`)
- **Local State**: React useState and useReducer hooks
- **Server State**: Next.js API routes with client-side fetching

### Data Layer
- **Models**: TypeScript interfaces in `src/lib/models/`
- **Services**: Database operations in `src/lib/services/`
- **Database**: MongoDB connection and utilities in `src/lib/mongodb.ts`

### Authentication Flow
- **JWT-based**: Custom implementation with localStorage
- **Context Provider**: `AuthContext` for global auth state
- **Middleware**: Route protection in `src/lib/auth-middleware.ts`

## File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Pages**: kebab-case (e.g., `user-dashboard/`)
- **Utilities**: kebab-case (e.g., `database-utils.ts`)
- **Contexts**: kebab-case with suffix (e.g., `auth-context.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)

## Import Patterns
- **Path Aliases**: Use `@/` for all internal imports
- **Relative Imports**: Avoid deep relative paths, prefer aliases
- **Component Imports**: Import from `@/components/ui` for base components

## Code Organization Rules
- **Single Responsibility**: Each file should have one primary purpose
- **Feature Grouping**: Group related functionality by domain
- **Separation of Concerns**: Keep UI, business logic, and data separate
- **Reusability**: Extract common patterns into hooks and utilities

## Environment Configuration
- **Development**: `.env.local` for local development
- **Production**: Environment variables for deployment
- **Database**: MongoDB Atlas connection string
- **AI**: Google Gemini API key configuration