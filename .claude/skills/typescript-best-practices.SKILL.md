# TypeScript Best Practices Skill

This skill provides TypeScript best practices for type-safe code.

## Type Definitions
- Always define interfaces for props and component state
- Use type aliases for complex types
- Prefer interfaces over type aliases for object shapes
- Use `const` assertions for literal types

## Type Safety
- Avoid `any` - use `unknown` if type is truly unknown
- Use type guards for runtime type checking
- Leverage discriminated unions for state management
- Use generics for reusable components and functions

## Common Patterns
```typescript
// Props interface
interface ComponentProps {
  id: string;
  name: string;
  optional?: boolean;
  callback: (value: string) => void;
}

// State type
type ComponentState = {
  loading: boolean;
  data: DataType | null;
  error: Error | null;
};

// Generic function
function processData<T>(data: T): T {
  return data;
}
```

## Type Utilities
- Use `Partial<T>` for optional properties
- Use `Pick<T, K>` to select properties
- Use `Omit<T, K>` to exclude properties
- Use `Record<K, V>` for object maps

## Error Handling
- Define error types explicitly
- Use Result types for operations that can fail
- Type error boundaries properly

