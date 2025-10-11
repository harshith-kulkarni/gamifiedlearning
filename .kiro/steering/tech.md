# Technology Stack

## Framework & Runtime
- **Next.js 15.3.3**: React framework with App Router, Server Components, and Turbopack
- **React 18**: UI library with hooks and context patterns
- **TypeScript 5**: Strict typing with path aliases (`@/*` for `./src/*`)
- **Node.js**: Runtime environment

## AI & Backend Services
- **Google Genkit**: AI framework for building AI-powered applications
- **Google Gemini 2.5 Flash**: Primary AI model for content generation and Q&A
- **MongoDB**: Database for user data, progress tracking, and session storage
- **NextAuth.js**: Authentication with JWT tokens and MongoDB adapter

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library
- **CSS Variables**: HSL-based color system with dark mode support

## Form Handling & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation and type safety
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Development Tools
- **ESLint**: Code linting (build errors ignored in config)
- **PostCSS**: CSS processing
- **Patch Package**: For maintaining package patches

## Common Commands

```bash
# Development
npm run dev                 # Start dev server with Turbopack on port 3000
npm run genkit:dev         # Start Genkit development server
npm run genkit:watch       # Start Genkit with file watching

# Build & Deploy
npm run build              # Production build
npm run start              # Start production server
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint code linting

# Database Setup
# See setup-mongodb.md for MongoDB installation options
```

## Environment Variables Required
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: JWT signing secret
- `NEXTAUTH_URL`: Application URL for auth callbacks
- `GEMINI_API_KEY`: Google AI API key