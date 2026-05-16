# Production Deployment

This repository is set up to deploy to Vercel from GitHub Actions.

## 1. Required GitHub Secrets

Set these repository secrets in GitHub (`Settings -> Secrets and variables -> Actions`):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 2. Required Environment Variables (Vercel)

Set this in your Vercel project for Production:

- `NEXT_PUBLIC_SITE_URL=https://your-production-domain`

`NEXT_PUBLIC_SITE_URL` is used by `app/layout.tsx` to set canonical metadata.

## 3. Workflows

- CI: `.github/workflows/ci.yml`
  - Runs lint, typecheck, and build on PRs and pushes to `main`.
- Production deploy: `.github/workflows/deploy-vercel.yml`
  - Runs on pushes to `main` and manual dispatch.
  - Pulls Vercel config, builds, and deploys production artifacts.

## 4. First-time Vercel project link

From local machine (one time):

```bash
vercel link
vercel env pull .env.local
```

Then copy the generated project identifiers into GitHub secrets.

## 5. Release checklist

1. Merge to `main`.
2. Confirm CI passes in GitHub Actions.
3. Confirm `Deploy Vercel (Production)` workflow succeeds.
4. Verify the production URL loads and metadata resolves correctly.
