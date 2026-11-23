# Agent Knowledge Base

Internal knowledge base for contact center agents. Editors write how-to articles, agents search and read them during calls, and admins manage users and categories.

- `backend/`: Node + Express (TypeScript), Prisma, MySQL
- `frontend/`: Angular (standalone components), SCSS

## Prerequisites

- Node.js 22+
- Docker (for MySQL)

## Run locally

```bash
docker compose up -d                  # mysql 8 on localhost:3307

cd backend
cp .env.example .env                  # then fill in jwt secrets
npm install
npx prisma migrate dev                # creates tables + fulltext index
npm run dev                           # api on http://localhost:3000/api

cd ../frontend
npm install
npm start                             # app on http://localhost:4200
```

Health check: `GET http://localhost:3000/api/health`
