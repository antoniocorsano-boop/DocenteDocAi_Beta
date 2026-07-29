```markdown
# DocenteDocAi_Beta Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides guidance on contributing to the `DocenteDocAi_Beta` TypeScript codebase. It covers established coding conventions, commit patterns, and common workflows for maintaining code quality and consistency. The repository is organized without a major framework, focusing on modular TypeScript components, utilities, and services.

## Coding Conventions

### File Naming
- Use **PascalCase** for file names.
  - Example: `MyComponent.tsx`, `UserService.ts`

### Import Style
- Use **relative imports** for internal modules.
  ```typescript
  import MyComponent from '../components/MyComponent';
  import { fetchUser } from './utils';
  ```

### Export Style
- Use **default exports** for modules.
  ```typescript
  // In UserService.ts
  const UserService = { ... };
  export default UserService;
  ```

### Commit Patterns
- Follow **conventional commit** style.
- Use prefixes such as `fix`.
  - Example: `fix: remove redundant useEffect in DocumentList (77 chars)`

## Workflows

### Bulk Refactor or Cleanup Across Multiple Components
**Trigger:** When you need to apply a codebase-wide fix, refactor, or cleanup (such as removing deprecated code or resolving lint errors) that affects multiple UI components and supporting files.  
**Command:** `/bulk-cleanup`

1. **Identify** redundant code, deprecated calls, or lint errors across the codebase.
2. **Edit** all affected files, typically in:
    - `src/components/*.tsx`
    - `src/hooks/*.ts`
    - `src/services/*.ts`
    - `src/utils/*.ts`
    - `src/ai/brain/*.ts`
    - `e2e/setup-test-results.ts`
    - `e2e/storage-state.json`
3. **Update** related test or setup files if needed.
4. **Commit** all changes in a single commit with a descriptive message.

**Example:**
```typescript
// Before cleanup
useEffect(() => {
  fetchData();
}, [fetchData]);

// After removing redundant useEffect
fetchData();
```

**Commit Example:**
```
fix: remove redundant useEffect and resolve lint errors in multiple components
```

## Testing Patterns

- Test files follow the pattern: `*.test.*`
  - Example: `DocumentList.test.tsx`
- The testing framework is not explicitly specified.
- Place tests alongside the files they cover or in a dedicated test directory.

## Commands

| Command        | Purpose                                                                 |
|----------------|------------------------------------------------------------------------|
| /bulk-cleanup  | Initiate a sweeping code cleanup or refactor across multiple components |
```
