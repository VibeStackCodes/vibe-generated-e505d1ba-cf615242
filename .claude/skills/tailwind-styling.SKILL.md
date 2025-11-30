# Tailwind CSS Styling Skill

This skill provides Tailwind CSS best practices and patterns.

## Utility-First Approach
- Use utility classes directly in JSX
- Prefer utilities over custom CSS when possible
- Use responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
- Leverage state variants (hover:, focus:, active:, disabled:)

## Common Patterns
```tsx
// Responsive design
<div className="w-full md:w-1/2 lg:w-1/3">

// Spacing
<div className="p-4 m-2 space-y-4">

// Colors
<div className="bg-primary text-white hover:bg-primary/90">

// Flexbox
<div className="flex items-center justify-between gap-4">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Color Usage
- Use semantic color names (primary, secondary, accent)
- Apply opacity with / syntax (bg-primary/50)
- Use dark mode variants (dark:bg-gray-800)
- Maintain brand consistency with custom colors

## Component Styling
- Use clsx or tailwind-merge for conditional classes
- Extract repeated patterns into reusable components
- Use @apply in CSS for complex patterns (sparingly)
- Maintain consistent spacing scale

## Accessibility
- Ensure sufficient color contrast
- Use focus-visible for keyboard navigation
- Include proper ARIA labels
- Test with screen readers

## Performance
- Use JIT mode for optimal bundle size
- Purge unused styles in production
- Prefer utilities over custom CSS
- Use CSS variables for dynamic theming

