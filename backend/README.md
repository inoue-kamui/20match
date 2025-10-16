# 20match Backend

Nest.js 11 + Prisma based backend for the 20match application.

## Prerequisites

- Node.js 20.12+ (24 LTS ready)
- npm 10.5+
- PostgreSQL 15+ (development)

## Setup

```bash
cd backend
npm install
cp env.example .env
```

Update `.env` with a valid `DATABASE_URL` and `JWT_SECRET`.

## Database

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## Development

```bash
npm run start:dev
```

The API listens on `http://localhost:3000/api` by default.

### Temporary authentication placeholder

Until JWT authentication is implemented, `POST /posts` expects the authenticated user id in the `x-user-id` header.

## Testing

```bash
npm test
```

Unit tests cover service-layer logic for users and posts.
