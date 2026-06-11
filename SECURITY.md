# Security

CreatorStreamOps Studio is designed as local-first creator productivity software.

## Authentication

- Local admin login is required for protected API routes.
- Password verification uses bcrypt.
- Sessions use HTTP-only cookies.
- Demo credentials are documented for testing only and must be changed before real use.

## Platform Safety

The MVP does not post to TikTok, scrape TikTok, automate engagement, bypass eligibility, collect TikTok passwords, or perform mass messaging.

## Safe Errors

API errors return short safe messages. Stack traces, absolute paths, secrets, tokens, and environment variables are not returned to the client.

## Secrets

Do not commit `.env`, API keys, private keys, tokens, passwords, runtime data, logs, `node_modules/`, or build output.
