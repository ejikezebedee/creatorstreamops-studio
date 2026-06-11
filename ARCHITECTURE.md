# Architecture

CreatorStreamOps Studio is a local-first TypeScript application.

## Frontend

The frontend is a React/Vite dashboard with authenticated access to planning, LIVE operations, analytics, reports, settings, and audit log screens. It uses simple CSS and lucide-react icons.

## Backend

The backend is an Express API under `/api`. Zod validates request bodies. API errors return safe messages and do not expose stack traces, secrets, environment variables, or local paths.

## Storage

Data is stored in `./data/creatorstreamops.json`. Writes use atomic temporary-file replacement. Runtime data is excluded from Git.

## Auth

Local admin login uses bcrypt password verification and an HTTP-only session cookie. Protected API routes require the session cookie.

## Core Engines

- Readiness engine: video, LIVE, and campaign verdicts.
- Report engine: video production brief, LIVE production brief, post-LIVE report, weekly CreatorOps report, and campaign report.
- Caption risk checklist: flags simple claim, regulated promise, harassment, adult/unsafe, copyright, and sponsorship disclosure issues for human review.
