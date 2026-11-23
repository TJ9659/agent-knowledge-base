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
cp .env.example .env                  # then set JWT_ACCESS_SECRET (openssl rand -hex 32)
npm install
npx prisma migrate dev                # creates tables + fulltext index
npm run db:seed                       # demo users, categories and articles
npm run dev                           # api on http://localhost:3000/api

cd ../frontend
npm install
npm start                             # app on http://localhost:4200
```

Health check: `GET http://localhost:3000/api/health`

## Demo accounts

All accounts use the password `Password123!`.

| Name | Email | Role | Notes |
| --- | --- | --- | --- |
| Aisha Rahman | admin@nexora.test | Admin | Manages users and categories |
| Daniel Tan | editor@nexora.test | Editor | Main editor |
| Priya Nair | editor2@nexora.test | Editor | Owns other articles (shows the own-only rule) |
| Hafiz Ismail | agent@nexora.test | Agent | Main agent |
| Mei Ling Wong | agent2@nexora.test | Agent | Deactivated, login is blocked |

The demo data is for **Nexora Telecom**, a fictional broadband and mobile company. All names, prices and policies are made up.

## API testing

Import `backend/postman/agent-kb.postman_collection.json` into Postman. Run a login request first, it saves the access token for the other requests.
