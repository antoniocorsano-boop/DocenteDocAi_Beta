# Vercel Preview Deployment Design

## Goal

Publish the current `main` branch as a protected test deployment at no cost, including the Gemini-backed `/api/ai` endpoint, without changing the existing public production domain.

## Hosting Choice

Use the Vercel Hobby plan because the repository already contains a compatible `vercel.json`, Vite build configuration, and Vercel serverless functions under `api/`.

Netlify would require adapting the serverless functions. Cloudflare Pages would require porting the API handlers to Workers. Neither migration is justified for this test.

## Deployment Scope

- Deploy the current repository as a Vercel Preview Deployment.
- Keep `https://docentedoc-ai.vercel.app` unchanged.
- Protect the preview with Vercel Authentication.
- Grant access to the owner and one external tester, which fits the Vercel Hobby limit.
- Use the generated preview URL for all testing.

## AI Configuration

- Create a Gemini API key through Google AI Studio.
- Store it only as the `GEMINI_API_KEY` environment variable in Vercel.
- Scope the variable to Preview deployments unless Vercel requires a broader scope for the linked project.
- Never write the key to tracked files, command output, documentation, or chat.
- Route browser requests through the existing relative `/api/ai` endpoint so Vercel Authentication also protects API requests.

The existing API proxy keeps the key server-side, rejects non-POST requests, limits request bodies, and applies a best-effort per-IP rate limit. Vercel Authentication is the primary access control for this test.

## Deployment Flow

1. Verify the worktree is clean and `main` is aligned with `origin/main`.
2. Run the production build and focused tests for the AI proxy.
3. Authenticate the local Vercel CLI again because the existing credential is invalid.
4. Link the local repository to the existing Vercel project, or select the matching project during deployment.
5. Add `GEMINI_API_KEY` as a Preview environment secret through Vercel without exposing its value.
6. Enable Vercel Authentication with Standard Protection for preview and generated deployment URLs.
7. Create a Preview Deployment without promoting it to production.
8. Grant the single external tester access through Vercel.

## Verification

Verify the protected preview in this order:

- Unauthenticated access redirects to Vercel login.
- The authorized owner can load the application.
- The authorized external tester can access the preview after approval.
- Static assets, service worker resources, and SPA routes load successfully.
- A basic offline/local workflow succeeds.
- One low-cost AI request succeeds through `/api/ai` without exposing the API key.
- Browser console and Vercel function logs show no deployment-blocking errors.
- The existing production URL still serves its previous deployment.

## Failure Handling

- If the build or tests fail, stop before deployment and fix only deployment-blocking defects.
- If the Vercel project cannot be linked safely, stop and confirm the intended project rather than creating a duplicate silently.
- If the Gemini key cannot use the configured model, select a currently available free-tier Flash model through the application's existing model configuration; do not enable billing automatically.
- If Vercel Authentication cannot grant the tester access within the Hobby limit, keep the preview owner-only and report the blocker rather than making the deployment public.
- If preview verification fails, retain the deployment for log inspection but do not promote it to production.

## Out of Scope

- Production deployment or production-domain changes.
- Paid Vercel or Gemini plans.
- Application-level authentication changes.
- Migration to Netlify, Cloudflare, or another hosting provider.
- Configuration of Telegram, WhatsApp, Stripe, Google Drive, PostgreSQL, or the separate Express server.
