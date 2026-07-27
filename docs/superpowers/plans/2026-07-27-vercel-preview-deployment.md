# Protected Vercel Preview Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the current application as a free, protected Vercel Preview Deployment with a server-side Gemini key and access for one external tester.

**Architecture:** Keep the existing Vite frontend and Vercel functions unchanged. Link the repository to the existing Vercel project, store `GEMINI_API_KEY` only in Vercel's Preview environment, and protect generated preview URLs with Vercel Authentication while leaving the production domain untouched.

**Tech Stack:** Vite 6, React 18, TypeScript, Vitest, Vercel CLI 50, Vercel Hobby, Google Gemini API

---

## File And Configuration Map

- Verify only: `package.json` defines build and test commands.
- Verify only: `vercel.json` defines the Vite output, SPA rewrites, headers, and Vercel function routing.
- Verify only: `api/ai.ts` reads `GEMINI_API_KEY` server-side and exposes the AI proxy.
- Verify only: `__tests__/services/aiProxy.test.ts` covers the AI proxy contract.
- Generated locally and ignored: `.vercel/project.json` records the selected Vercel project link.
- Configure remotely: Vercel Preview environment variable `GEMINI_API_KEY`.
- Configure remotely: Vercel Authentication with Standard Protection.
- No application source file should be created or modified during this deployment.

### Task 1: Establish A Clean Deployment Baseline

**Files:**
- Verify: `docs/superpowers/specs/2026-07-27-vercel-preview-deployment-design.md`
- Verify: `package.json`
- Verify: `vercel.json`

- [ ] **Step 1: Refresh remote Git references**

Run:

```powershell
git fetch --prune origin
```

Expected: command exits with status 0; output may be empty.

- [ ] **Step 2: Check branch alignment and worktree state**

Run:

```powershell
git status --short --branch
```

Expected: branch is `main`; divergence is `0 0`. The only acceptable pending change is this plan if it has not yet been committed. Stop if unrelated changes would enter the deployment.

- [ ] **Step 3: Confirm no environment files are tracked**

Run:

```powershell
git ls-files ".env*"
```

Expected: no output. Stop and remove secrets from Git history before deployment if an environment file is listed.

- [ ] **Step 4: Record the production deployment before testing**

Run:

```powershell
Invoke-WebRequest -Uri "https://docentedoc-ai.vercel.app" -Method Head | Select-Object StatusCode,Headers
```

Expected: HTTP `200` and response headers are recorded for the final production comparison.

### Task 2: Verify The Build And AI Proxy Locally

**Files:**
- Verify: `package-lock.json`
- Verify: `api/ai.ts`
- Test: `__tests__/services/aiProxy.test.ts`

- [ ] **Step 1: Install the locked dependencies**

Run:

```powershell
npm ci --legacy-peer-deps
```

Expected: exit status 0 with no unresolved dependency error.

- [ ] **Step 2: Run the focused AI proxy tests**

Run:

```powershell
npm run test:unit -- __tests__/services/aiProxy.test.ts
```

Expected: `__tests__/services/aiProxy.test.ts` passes with no failed tests.

- [ ] **Step 3: Build the production bundle**

Run:

```powershell
npm run build
```

Expected: Vite exits with status 0 and writes the ignored `dist/` directory.

- [ ] **Step 4: Confirm build artifacts exist**

Run:

```powershell
Test-Path -LiteralPath "dist/index.html"
Get-ChildItem -LiteralPath "dist/assets" | Measure-Object
```

Expected: `True` for `dist/index.html` and at least one generated asset.

### Task 3: Restore Vercel Authentication And Link The Existing Project

**Files:**
- Generate: `.vercel/project.json` (ignored by Git)
- Verify: `.gitignore`

- [ ] **Step 1: Start Vercel authentication**

Run:

```powershell
vercel login
```

Expected: Vercel prints a browser or device-authentication flow. The repository owner completes the flow in the browser; the command then reports a successful login. Never pass a token in chat or commit it to the repository.

- [ ] **Step 2: Verify the authenticated identity**

Run:

```powershell
vercel whoami
```

Expected: the Vercel account that owns the existing `docentedoc-ai` project is printed.

- [ ] **Step 3: Link the repository without creating a duplicate project**

Run:

```powershell
vercel link
```

Expected interactive choices:

```text
Set up this directory? yes
Select the account that owns the existing deployment
Link to existing project? yes
Select the existing DocenteDoc AI project that owns docentedoc-ai.vercel.app
```

Expected: Vercel writes `.vercel/project.json`. Stop if the existing project is not listed; do not create a similarly named project silently.

- [ ] **Step 4: Confirm the link is ignored and inspect its identifiers**

Run:

```powershell
git check-ignore .vercel/project.json
Get-Content -LiteralPath ".vercel/project.json"
git status --short
```

Expected: `.vercel/project.json` is ignored, contains `projectId` and `orgId`, and does not appear in `git status`.

### Task 4: Create And Store The Gemini Preview Secret

**Files:**
- Configure remotely: Vercel Preview variable `GEMINI_API_KEY`
- Verify only: `api/ai.ts:318`

- [ ] **Step 1: Create a Google AI Studio API key**

Open:

```text
https://aistudio.google.com/app/apikey
```

Expected: the repository owner signs in, creates a key for a test project with no paid billing enabled, and keeps the value outside the repository and chat.

- [ ] **Step 2: Add the key to the Vercel Preview environment using the secure prompt**

Run:

```powershell
vercel env add GEMINI_API_KEY preview
```

Expected: Vercel prompts for the value without requiring it in the command line, then confirms that `GEMINI_API_KEY` was added to Preview.

- [ ] **Step 3: Verify only the variable name and scope**

Run:

```powershell
vercel env ls
```

Expected: `GEMINI_API_KEY` is listed for Preview. Do not run commands that print or pull the secret value into the workspace.

### Task 5: Enable Free Preview Protection

**Files:**
- Configure remotely: Vercel project Deployment Protection

- [ ] **Step 1: Open the linked project's protection settings**

Run:

```powershell
vercel open
```

Expected: the linked project opens in the Vercel dashboard.

- [ ] **Step 2: Enable Vercel Authentication for previews**

In the dashboard, open `Settings` then `Deployment Protection` and set:

```text
Protection method: Vercel Authentication
Scope: Standard Protection
```

Expected: preview and generated deployment URLs require Vercel login, while the production domain remains public on Hobby.

- [ ] **Step 3: Confirm the Hobby access constraint**

In `Deployment Protection`, open `Access` or `Requests`.

Expected: no more than one external tester is granted access. Do not upgrade to a paid plan.

### Task 6: Create The Protected Preview Deployment

**Files:**
- Read: `vercel.json`
- Deploy: current committed Git tree and local workspace content

- [ ] **Step 1: Confirm the deployment is not production-targeted**

Run:

```powershell
git status --short --branch
```

Expected: current branch and intentional documentation state are visible. The deploy command in the next step must not include `--prod`.

- [ ] **Step 2: Deploy to Preview**

Run:

```powershell
vercel deploy
```

Expected: build succeeds and Vercel prints a generated deployment URL. The output must identify a Preview deployment, not Production.

- [ ] **Step 3: Inspect deployment status**

Capture the exact generated URL printed by the prior command, then inspect it:

```powershell
$previewUrl = Read-Host "Paste the generated Preview URL"
vercel inspect $previewUrl
```

Expected: deployment state is `Ready`, target is Preview, and the linked project matches the existing DocenteDoc AI project. The URL is copied from Vercel output and is not a secret.

- [ ] **Step 4: Verify unauthenticated protection**

Run with the same generated URL:

```powershell
$previewUrl = Read-Host "Paste the generated Preview URL"
Invoke-WebRequest -Uri $previewUrl -MaximumRedirection 0 -ErrorAction SilentlyContinue
```

Expected: the response redirects to Vercel authentication or returns Vercel's protected-deployment response; it must not return the application anonymously.

### Task 7: Authorize The External Tester

**Files:**
- Configure remotely: Vercel deployment access list

- [ ] **Step 1: Send the generated Preview URL to the selected tester**

Expected: the tester opens the URL, signs in or creates a free Vercel account, and selects `Request access`.

- [ ] **Step 2: Approve exactly one external access request**

In the linked project's dashboard, open `Settings`, `Deployment Protection`, then `Requests`.

Expected: approve the selected tester and leave all unrelated requests denied or pending.

- [ ] **Step 3: Confirm tester access**

Expected: the tester reloads the same generated Preview URL and reaches the application. Do not share the production URL as the test target.

### Task 8: Run Protected Preview Smoke Tests

**Files:**
- Verify remotely: deployed frontend
- Verify remotely: deployed `/api/ai` function
- Verify locally: `playwright.config.ts`

- [ ] **Step 1: Verify owner navigation in a browser**

Open the protected Preview URL while authenticated and verify:

```text
Application shell renders
Main navigation changes views without a 404
Browser refresh on a nested SPA route returns the application
No blocking error appears in the browser console
```

Expected: all four checks succeed.

- [ ] **Step 2: Verify a local/offline workflow**

Create or edit one non-sensitive test item in the application, refresh the page, and verify it remains available through the application's local persistence.

Expected: the test item persists without sending real student data.

- [ ] **Step 3: Verify one low-cost AI request**

Submit a minimal non-sensitive prompt through the application:

```text
Rispondi soltanto con: test riuscito
```

Expected: the UI receives an AI response through `/api/ai`; browser network tools show no `GEMINI_API_KEY`, and the request does not return `401`, `403`, `429`, or `500`.

- [ ] **Step 4: Inspect function logs without exposing secrets**

Run with the generated URL:

```powershell
$previewUrl = Read-Host "Paste the generated Preview URL"
vercel logs $previewUrl
```

Expected: the `/api/ai` invocation is present without an unhandled exception. Do not paste logs containing user content or credentials into tracked files.

- [ ] **Step 5: Confirm the external tester's smoke test**

Ask the authorized tester to load the app and perform the same minimal AI prompt.

Expected: the tester confirms both app access and a successful response.

### Task 9: Verify Production Isolation And Record The Result

**Files:**
- Modify: `docs/superpowers/plans/2026-07-27-vercel-preview-deployment.md` (checkboxes only)

- [ ] **Step 1: Recheck the public production domain**

Run:

```powershell
Invoke-WebRequest -Uri "https://docentedoc-ai.vercel.app" -Method Head | Select-Object StatusCode,Headers
```

Expected: HTTP `200`; production remains publicly reachable and was not replaced by the Preview deployment.

- [ ] **Step 2: Confirm Git contains no generated deployment metadata or secrets**

Run:

```powershell
git status --short --branch
```

Expected: no tracked `.env` or `.vercel` files, no whitespace errors, and only intentional plan checkbox changes if progress was recorded.

- [ ] **Step 3: Commit only plan execution records if checkboxes were updated**

Run only when this plan has tracked checkbox changes:

```powershell
git add -- docs/superpowers/plans/2026-07-27-vercel-preview-deployment.md
```

Expected: a documentation-only commit. Do not stage `.vercel`, `dist`, environment files, or unrelated user changes.

- [ ] **Step 4: Report the test endpoint safely**

Report:

```text
Preview deployment: Ready
Protection: Vercel Authentication enabled
Authorized external testers: 1
Frontend smoke test: passed or exact failure
AI smoke test: passed or exact failure
Production domain: unchanged
```

Expected: provide the generated Preview URL to the owner, but do not report the Gemini key or any authentication token.
