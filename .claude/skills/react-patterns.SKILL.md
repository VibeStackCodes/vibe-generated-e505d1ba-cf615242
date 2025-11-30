# React Patterns Skill

This skill provides best practices and patterns for React development.

## Functional Components
- Always use functional components with hooks
- Prefer `const` for component declarations
- Use TypeScript for type safety

## Hooks Best Practices
- Use `useState` for local component state
- Use `useEffect` for side effects with proper cleanup
- Use `useCallback` and `useMemo` for performance optimization when needed
- Extract custom hooks for reusable logic

## Component Structure
```typescript
import { useState, useEffect } from 'react';

interface ComponentProps {
  // Define props interface
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue);

  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## State Management
- Keep state as local as possible
- Lift state up only when necessary
- Consider context for deeply nested prop drilling
- Use proper state update patterns (functional updates for objects/arrays)

## Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Avoid creating functions/objects in render
- Use code splitting for large applications

