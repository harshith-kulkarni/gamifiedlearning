<!------------------------------------------------------------------------------------
---
inclusion: always
---

# StudyMaster AI - Code Quality & Standards

## Critical Task Completion Protocol

**MANDATORY**: Before marking ANY task complete, verify ALL items in the Final Checklist section.

## API Endpoint Standards

### RESTful Conventions
```typescript
// ✅ CORRECT
GET    /api/user/profile
POST   /api/user/study-session  
PUT    /api/user/progress
DELETE /api/user/study-session/:id

// ❌ INCORRECT
GET    /api/getUser
POST   /api/session-create
```

### Response Format
```typescript
// Success
{ success: true, data: {...}, message?: "..." }

// Error  
{ success: false, error: "User-friendly message", code?: "ERROR_CODE" }
```

### Status Codes
- `200` GET/PUT/DELETE success
- `201` POST resource created
- `400` Invalid input
- `401` Authentication required
- `404` Not found
- `500` Server error

## Code Standards

### TypeScript Requirements
- **No `any` types** - Use explicit interfaces/types
- **Zod validation** for API inputs and forms
- **Proper error handling** with user-friendly messages

```typescript
// ✅ CORRECT
interface ProgressUpdate {
  points: number;
  level: number;
  badges: string[];
}

function updateProgress(data: ProgressUpdate): Promise<UserProgress> { }

// ❌ INCORRECT  
function updateProgress(data: any): any { }
```

### React Component Standards
```typescript
interface StudyCardProps {
  topic: string;
  duration: number;
  onStart: () => void;
  isLoading?: boolean;
}

export function StudyCard({ topic, duration, onStart, isLoading = false }: StudyCardProps) {
  if (!topic) return <EmptyState message="No topic selected" />;
  
  return (
    <div className="study-card" role="article" aria-label={`Study ${topic}`}>
      {/* Component content */}
    </div>
  );
}
```

### Required Component Features
- Typed props with interfaces
- Loading, error, and empty states
- Accessibility attributes (aria-labels, roles)
- Early returns for edge cases

## Dead Code Prevention

### Must Remove
- Unused imports, variables, functions
- Commented-out code blocks  
- Console.log debugging statements
- TODO/FIXME without tickets
- Orphaned components

### Code Cleanliness
```typescript
// ❌ INCORRECT - Unused imports
import { useState, useEffect, useMemo } from 'react';
import { formatDate } from '@/lib/utils';

function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ✅ CORRECT - Clean imports
import { useState } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

## MANDATORY Final Checklist

**CRITICAL**: Before marking ANY task complete, verify ALL items:

- [ ] **Dead Code**: Removed unused imports, variables, functions, commented code
- [ ] **Testing**: Traced logic for success, error, and edge cases  
- [ ] **API Conventions**: RESTful endpoints with proper HTTP verbs
- [ ] **Error Messages**: User-friendly, not technical jargon
- [ ] **Loose Ends**: Addressed or documented all TODO/FIXME comments
- [ ] **Readability**: Code is immediately understandable to experienced developers
- [ ] **Console Logs**: No debugging logs remain
- [ ] **TypeScript**: Proper typing, no `any` types, well-defined interfaces
- [ ] **Integration**: Verified compatibility with existing features
- [ ] **Production Ready**: Secure, performant, complete error handling

### Completion Response Format

```
Modified Files: [list all changed files]

Quality Verification:
✅ Dead Code: [specific evidence]
✅ Testing: [scenarios verified]  
✅ API Conventions: [endpoint pattern confirmed]
✅ Error Messages: [user-friendly examples]
✅ Loose Ends: [TODO status]
✅ Readability: [clarity confirmation]
✅ Console Logs: [debugging removed]
✅ TypeScript: [typing verification]
✅ Integration: [compatibility confirmed]
✅ Production Ready: [security/performance verified]

✅ Task Complete: All quality checks passed. Code is production-ready.
```

**If ANY item fails, continue working until ALL pass.**
-------------------------------------------------------------------------------------> 