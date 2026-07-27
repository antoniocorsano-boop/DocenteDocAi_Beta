# 📋 LINT REFACTOR EXECUTION GUIDE

**Project**: DocenteDoc AI  
**Date**: January 5, 2026  
**Goal**: Reduce 208 lint errors to 0  
**Timeline**: 4 fasi, ~7 ore totali  

---

## 🎯 Executive Summary

### Current State
```
✖ 309 problems (208 errors, 101 warnings)
❌ Blocks: commits, PRs, deployment
⏱️ Time to fix: 6-7 hours (distributed work)
```

### Target State
```
✓ 0 problems (0 errors, 0 warnings)
✅ Enables: normal git workflow
⏱️ After completion: ongoing monitoring only
```

---

## 📚 Complete Documentation Set

| Phase | File | Duration | Errors |
|-------|------|----------|--------|
| **1.1** | [PHASE_1.1_DATAVALIDATOR.md](PHASE_1.1_DATAVALIDATOR.md) | 1h | 38 ❌ |
| **1.2** | [PHASE_1.2_VIEWMANAGER.md](PHASE_1.2_VIEWMANAGER.md) | 1h | 25 ❌ |
| **1.3** | [PHASE_1.3_MODALMANAGER.md](PHASE_1.3_MODALMANAGER.md) | 45m | 12 ❌ |
| **2.1** | aiService.ts (32 ⚠️) | 1.5h | Type annotations |
| **2.2** | backupService.ts (2 ⚠️) | 10m | Type annotations |
| **3** | GitHub templates | 30m | Infrastructure |
| **4** | Verification | 30m | Validation |

---

## 🚀 Quick Start

### Prerequisites
```bash
cd c:\Users\anton\DocenteDocAI-Flowise\docentedoc-ai

# Ensure fresh state
npm install
npm run prepare  # Initialize husky
```

### Phase 1: Critical Errors (2h 45m) 🔴 BLOCKING

```bash
# 1.1 - dataValidator.ts (38 errors)
# Time: 1 hour
# Read: PHASE_1.1_DATAVALIDATOR.md
# Action: Add type guards, remove `as any` casts
npm run lint src/utils/dataValidator.ts  # Verify 0 errors

# 1.2 - ViewManager.tsx (25 errors)
# Time: 1 hour
# Read: PHASE_1.2_VIEWMANAGER.md
# Action: Remove 9 unused imports, 15 unused variables
npm run lint src/components/ViewManager.tsx  # Verify 0 errors

# 1.3 - ModalManager.tsx (12 errors)
# Time: 45 minutes
# Read: PHASE_1.3_MODALMANAGER.md
# Action: Remove 6 imports, 11 variables
npm run lint src/components/ModalManager.tsx  # Verify 0 errors

# After Phase 1
npm run lint  # Check progress
# Expected: ~208 - 75 = ~133 errors remaining
```

### Phase 2: Warnings (1h 40m) 🟡 NON-BLOCKING

```bash
# 2.1 - aiService.ts (32 warnings)
# Time: 1.5 hours
# Action: Add return type annotations to 32 functions
npm run lint src/services/aiService.ts  # Verify warnings resolved

# 2.2 - backupService.ts (2 warnings)
# Time: 10 minutes
# Action: Add return type annotations to 2 functions
npm run lint src/services/backupService.ts  # Verify resolved

# After Phase 2
npm run lint  # Check full status
# Expected: 0 errors, ~60 warnings remaining (acceptable)
```

### Phase 3: Infrastructure (30m) 📋 SETUP

```bash
# GitHub issue templates already created:
# - .github/ISSUE_TEMPLATE/lint-debt.md

# Documentation already created:
# - LINT_REFACTOR_PLAN.md
# - PHASE_1.1_DATAVALIDATOR.md
# - PHASE_1.2_VIEWMANAGER.md
# - PHASE_1.3_MODALMANAGER.md
```

### Phase 4: Verification (30m) ✅ VALIDATION

```bash
# Run comprehensive checks
npm run lint           # Full lint report
npm run test:unit      # Verify all 1152 tests pass
npm run lint:metrics   # Generate metrics snapshot
npm run build          # Verify production build

# Pre-commit test
git add .
git commit -m "refactor: complete lint debt resolution"
# Should succeed with husky hook

# Expected output:
# ✓ All checks pass
# ✓ Build succeeds
# ✓ Tests: 1152/1152 pass
```

---

## 📊 Detailed Phase Breakdown

### PHASE 1.1: dataValidator.ts

**File**: `src/utils/dataValidator.ts` (148 lines)

**Problem**: 38 `no-explicit-any` errors - uses `as any` extensively

**Cause**: File casts unknown backup data types without proper guards

**Solution Options**:
1. **Quick (5 min)**: Suppress with comment (not recommended)
2. **Optimal (45 min)**: Add type guards + generics

**Recommended**: Optimal

**Implementation**:
```typescript
// Add type guards
const isUser = (value: unknown): value is User => { /* ... */ };
const isStudente = (value: unknown): value is Studente => { /* ... */ };

// Update validation function
export function validateBackupData(data: unknown): BackupPayload | null {
  // ... proper type checking
  const validated: BackupPayload = {
    user: isUser(backup.user) ? backup.user : null,
    students: ensureArray<Studente>(backup.students),
    // ...
  };
}
```

**Result**: 38 errors → 0 errors

---

### PHASE 1.2: ViewManager.tsx

**File**: `src/components/ViewManager.tsx` (425 lines)

**Problem**: 25 errors (9 unused imports + 15 unused variables)

**Cause**: 
- Imports added for future use but never implemented
- Destructure everything from store, use only subset

**Solution**: Clean removal (100% safe)

**Implementation**:
```typescript
// Remove from imports:
// - EventoCalendario, KnowledgeBaseEntry, Rubrica, PianoInclusione, 
//   GiudizioPeriodico, LessonScheduleInput, EvaluationInput, UdaCreateInput

// Remove from destructuring:
// - activeSuggestion, isGlobalAiLoading, notifiche, feedSources, 
//   competencyEvals, and 10 unused handlers
```

**Benefit**: Code clarity, reduced cognitive load

**Result**: 25 errors → 0 errors

---

### PHASE 1.3: ModalManager.tsx

**File**: `src/components/ModalManager.tsx` (100+ lines)

**Problem**: 12 errors (6 unused imports + 6 unused variables)

**Cause**: Dead code, planned features not yet implemented

**Solution**: Remove all

**Implementation**:
```typescript
// Remove:
// - 6 unused type imports
// - 4 unused appState variables (evaluations, competencyEvals, finalizedRegister)
// - 5 unused action handlers (handleNavigate, handleLoadDemoData, etc.)
```

**Result**: 12 errors → 0 errors

---

### PHASE 2.1: aiService.ts

**File**: `src/services/aiService.ts` (600+ lines)

**Problem**: 32 `explicit-module-boundary-types` warnings

**Cause**: Functions missing return type annotations

**Solution**: Add `: ReturnType` to 32 functions

**Example**:
```typescript
// Before
const generatePrompt = (context: AIContext) => {
  // ...
  return "text";
}

// After
const generatePrompt = (context: AIContext): string => {
  // ...
  return "text";
}
```

**Result**: 32 warnings → 0 warnings

---

### PHASE 2.2: backupService.ts

**File**: `src/services/backupService.ts`

**Problem**: 2 `explicit-module-boundary-types` warnings

**Solution**: Add return types to 2 functions

**Time**: ~10 minutes

**Result**: 2 warnings → 0 warnings

---

## 🔍 Key Files Reference

### Phase 1 Focus Files
- [PHASE_1.1_DATAVALIDATOR.md](PHASE_1.1_DATAVALIDATOR.md) - Detailed refactoring guide
- [PHASE_1.2_VIEWMANAGER.md](PHASE_1.2_VIEWMANAGER.md) - Import/variable cleanup
- [PHASE_1.3_MODALMANAGER.md](PHASE_1.3_MODALMANAGER.md) - Quick removal

### Configuration & Governance
- [LINT_GOVERNANCE.md](docs/LINT_GOVERNANCE.md) - Policy document
- [LINT_REFACTOR_PLAN.md](LINT_REFACTOR_PLAN.md) - Strategic plan
- [LINT_ONBOARDING.md](docs/LINT_ONBOARDING.md) - Developer guide

### GitHub Templates
- [.github/ISSUE_TEMPLATE/lint-debt.md](.github/ISSUE_TEMPLATE/lint-debt.md)

---

## ✅ Success Metrics

### During Execution

After each phase:
```bash
npm run lint  # Check remaining errors

# Phase 1.1: 208 → 170 errors
# Phase 1.2: 170 → 145 errors
# Phase 1.3: 145 → 133 errors
# Phase 2.1: 133 → 133 (warnings only)
# Phase 2.2: 133 → 133 (warnings only)
```

### Final State

```bash
npm run lint
# ✓ 0 problems (0 errors, 0 warnings)

npm run test:unit
# Test Files: 80 passed (80)
# Tests: 1152 passed (1152)

npm run build
# ✓ Build succeeds

git commit -m "..."
# ✓ Pre-commit hook passes
# ✓ Commit accepted
```

---

## 🚨 Common Issues & Solutions

### Issue: Type Guard Implementation

**Problem**: "I'm not sure how to implement the type guard"

**Solution**: See examples in PHASE_1.1_DATAVALIDATOR.md

**Reference**:
```typescript
const isUser = (value: unknown): value is User => {
  return value !== null && typeof value === 'object' && 'id' in value;
};
```

### Issue: Missing Tests After Refactoring

**Problem**: "Changes broke tests"

**Solution**: Run `npm run test:unit` immediately after each phase

**Prevention**: Small, focused changes per phase

### Issue: Import Not Found After Removal

**Problem**: "I removed an import used elsewhere"

**Solution**: 
1. Check error message for actual usage location
2. Don't remove, keep import
3. Verify with: `grep -r "ImportName" src/`

---

## 📅 Suggested Timeline

### Day 1
- **Morning (3 hours)**:
  - Phase 1.1: dataValidator.ts (1h)
  - Phase 1.2: ViewManager.tsx (1h)
  - Phase 1.3: ModalManager.tsx (45m)
  - Break: 15m

- **Afternoon (3 hours)**:
  - Phase 2.1: aiService.ts (1.5h)
  - Phase 2.2: backupService.ts (10m)
  - Phase 3: GitHub setup (30m)
  - Phase 4: Verification (20m)

---

## 🎯 Decision Tree

**Q: Should I suppress or fix?**
```
Answer: ALWAYS FIX
- Suppressions hide problems
- Types improve code quality
- Small effort now = big payoff later
```

**Q: Can I do phases in different order?**
```
Answer: YES, they're independent
- But recommended order for efficiency
- Phase 1 → Phase 2 → Phase 4 (Phase 3 is independent)
```

**Q: Do I need to run tests after each file?**
```
Answer: RECOMMENDED
- `npm run test:unit` after each phase
- Ensures no functional regression
- Only takes 20 seconds
```

---

## 📞 Support Resources

- 📖 **Main Plan**: [LINT_REFACTOR_PLAN.md](LINT_REFACTOR_PLAN.md)
- 📖 **Governance**: [docs/LINT_GOVERNANCE.md](docs/LINT_GOVERNANCE.md)
- 📖 **ESLint Docs**: https://typescript-eslint.io/rules/
- 🐙 **GitHub**: Create issue with `lint-debt` label
- 💬 **Slack**: #dev-tooling channel

---

## ✨ After Completion

### Immediate
- ✅ Deploy with clean lint
- ✅ Enable pre-commit linting
- ✅ Update CI/CD green checks

### Short-term (Week 1)
- ✅ Run `npm run lint:metrics` weekly
- ✅ Monitor new violations
- ✅ Review GitHub issues

### Long-term (Ongoing)
- ✅ Maintain 0 errors policy
- ✅ Type safe development
- ✅ Better team standards

---

**Good luck!** 🚀  
**Ask for help** if needed → [GitHub issue](../../issues)

---

*Last Updated: January 5, 2026*  
*Status: Ready for Execution*
