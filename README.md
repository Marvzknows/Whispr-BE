# Auth Template

Express 5 + TypeScript + Prisma 7 + PostgreSQL (Docker) with JWT access tokens
and rotating refresh tokens in httpOnly cookies.

## Quick start

1. `cp .env.example .env` and set `JWT_ACCESS_SECRET`
   (`node -p "require('node:crypto').randomBytes(48).toString('hex')"`)
2. `npm install`
3. `docker compose up -d`
4. `npm run db:migrate -- --name init`
5. `npm run db:generate`   # required after every clone and schema change
6. `npm run dev`

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | /auth/register | { email, password } |
| POST | /auth/login | returns accessToken, sets refresh cookie |
| POST | /auth/refresh | rotates refresh cookie, returns new accessToken |
| POST | /auth/logout | deletes refresh token, clears cookie |
| GET | /auth/me | protected (Bearer token) |

## Reusing this template

Click "Use this template" on GitHub (or clone and delete `.git`), then change
the DB name, JWT secret, and CLIENT_ORIGIN. See the checklist below.

## Requirements

Node 22+, Docker.