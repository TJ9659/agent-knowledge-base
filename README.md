<div align="center">

<img src="frontend/public/logo.svg" alt="Nexora KB logo" width="72" />

# Nexora KB

**A knowledge base for contact centre agents, with an AI assistant that answers from your own articles.**

Agents search or just ask a question, and get the steps they need while the customer is still on the line.
Editors write the articles. Admins look after users and categories.

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-5FA04E?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-RAG-8E75B2?logo=googlegemini&logoColor=white)

[Quick start](#quick-start) · [Features](#features) · [Screenshots](#screenshots) · [Highlights](#highlights) · [How it works](docs/how-it-works.md)

<br />

<img src="docs/screenshots/ask.png" alt="Ask the KB answering 'Customer was charged twice, what do I do?' with numbered steps and a link to the source article" width="860" />

</div>

<br />

## Features

**For agents**
- **Search that forgives you.** Type `ref` and you'll find *Refund and cancellation policy*. Results are ranked, not just matched.
- **Ask the KB.** Ask in plain words ("customer was billed twice") and get short numbered steps, each one linked to the article it came from.
- **Copy for the customer.** Every article has a highlighted *What to tell the customer* box with a one-click Copy button, and an amber *Escalate if* box.
- **Works on a phone**, with a compact menu and no sideways scrolling.

**For editors**
- **Write with a guided form**: one box per section, so every article has the same shape. Markdown works inside the boxes.
- **Preview** exactly what agents will see before saving.
- **Import from PDF.** Drop in an existing procedure, even a scanned one, and the form fills itself in for you to check.
- **Drafts** stay hidden from agents (and from the AI) until you publish.

**For admins**
- **Users**: add people, change roles and emails, deactivate and reactivate. The system admin account is protected.
- **Categories**: add, rename and delete, with article counts. A category that still has articles can't be deleted.

## Screenshots

| Browse and search | Read an article |
| :---: | :---: |
| <img src="docs/screenshots/articles.png" alt="Article list with search, categories and cards" /> | <img src="docs/screenshots/article.png" alt="Article page with the customer and escalation boxes" /> |
| **Ask the KB, with general advice when no article covers it** | **Import a PDF into the article form** |
| <img src="docs/screenshots/ask-general.png" alt="Ask the KB showing a labelled general advice box" /> | <img src="docs/screenshots/pdf-import.png" alt="New article form filled in from a PDF" /> |
| **Manage users** | **Manage categories** |
| <img src="docs/screenshots/admin-users.png" alt="Users table with roles, status and a protected system admin" /> | <img src="docs/screenshots/admin-categories.png" alt="Categories table with published and draft counts" /> |

<details>
<summary><b>On a phone</b></summary>
<br />
<p align="center">
  <img src="docs/screenshots/phone-articles.png" alt="Article list on a phone" width="280" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/phone-ask.png" alt="Ask the KB answer on a phone" width="280" />
</p>
</details>

## Quick start

**You'll need** Node.js 22+ and Docker.

```bash
# 1. start MySQL (runs on port 3307 so it won't clash with a local MySQL)
docker compose up -d

# 2. backend
cd backend
cp .env.example .env              # then set JWT_ACCESS_SECRET, e.g. openssl rand -hex 32
npm install
npx prisma migrate deploy         # creates the tables and the search index
npm run db:seed                   # demo users, categories and 20 articles
npm run dev                       # API on http://localhost:3000/api

# 3. frontend (in a second terminal)
cd frontend
npm install
npm start                         # app on http://localhost:4200
```

Open **http://localhost:4200** and sign in with one of the demo accounts below.

> [!TIP]
> **The AI features are optional.** Without a key, everything works except *Ask the KB* and *Import from PDF*, which politely say "AI unavailable".
> To turn them on, put a free key from [Google AI Studio](https://aistudio.google.com/) in `backend/.env` as `GEMINI_API_KEY`, restart the API, and run `npm run db:embed` once so the existing articles can be searched by meaning.

### Demo accounts

Every account uses the password **`Password123!`**

| Who | Email | Role | Try this |
| --- | --- | --- | --- |
| Admin User | `admin@nexora.test` | Admin | Users and Categories pages. This account is the protected system admin. |
| Daniel Tan | `editor@nexora.test` | Editor | Write an article, import a PDF, see *My articles* |
| Priya Nair | `editor2@nexora.test` | Editor | Owns other articles, so you can see that editors only edit their own |
| Hafiz Ismail | `agent@nexora.test` | Agent | Search, read, copy, and Ask the KB |
| Mei Ling Wong | `agent2@nexora.test` | Agent | Deactivated, so login is refused |

The demo company, **Nexora Telecom**, is made up. So are all the names, prices and policies.

## Tech stack

| Layer | What | Why |
| --- | --- | --- |
| Frontend | **Angular 22**, signals, reactive forms, plain **SCSS** | No UI library, as the brief asked for a simple CSS UI. Colours and spacing live in one tokens file. |
| Backend | **Node.js + Express 5**, **TypeScript** | Small, explicit layers: route → middleware → controller → service → repository |
| Database | **MySQL 8.4** (LTS) with **Prisma 7** | Prisma for migrations and everyday queries, raw SQL where it matters (search, reports) |
| Validation | **zod** | One schema checks a request and gives the TypeScript type |
| Auth | **JWT** access token + **httpOnly** refresh cookie, **argon2** password hashing | Short-lived tokens that can't be read by page scripts |
| AI | **Google Gemini** for answers, embeddings and PDF reading | Free tier, with a fallback across several models |

### How the brief is covered

| The brief asked for | Where to look |
| --- | --- |
| Angular / Node.js / MySQL | `frontend/`, `backend/`, `docker-compose.yml` |
| Authentication | Login, refresh with rotation, logout, rate-limited login, deactivated accounts refused |
| Authorization | Three roles checked on every API route, plus "editors edit only their own articles" |
| CRUD with pages | Articles, categories and users, each with its own pages |
| Simple CSS-based UI | Hand-written SCSS, no component library |

## Highlights

- **Safe sessions.** A 15-minute access token kept in memory, and a refresh token in an httpOnly cookie that's replaced on every use and stored only as a hash.
- **Permissions checked by the API**, not just hidden buttons. Editors can only change their own articles, and the system admin can't be locked out.
- **Search that ranks well.** MySQL FULLTEXT with word stemming and prefix matching, so `charged` finds *charge* and `ref` finds *refund*.
- **Ask the KB you can trust.** Keyword and meaning search merged, answers cited to their articles, general advice clearly labelled, and drafts never sent to the AI.
- **Keeps working when the AI doesn't.** Several Gemini models are tried in turn with a 5-second limit, and without a key the rest of the app runs normally.
- **PDF import with a human in the loop.** Gemini fills the form from any procedure PDF, even a scanned one, and nothing is saved until an editor checks it.

**Want the details?** [How it all works](docs/how-it-works.md) covers login, permissions, search, Ask the KB, PDF import, the full API and the design decisions.

## Testing

```bash
cd frontend && npm test           # 113 unit tests (Vitest)
cd backend && npm run typecheck   # strict TypeScript across the API
```

A Postman collection with 77 requests, error cases included, is in [`backend/postman/`](backend/postman/agent-kb.postman_collection.json). Every feature was also checked in a real browser as each role, on desktop and phone.

## What's next

- [ ] Backend tests with Vitest and Supertest (the API is checked by Postman and browser runs today)
- [ ] `docker compose up` for the whole app, not just the database
- [ ] A hosted demo
- [ ] Article version history and an audit log of who changed what
- [ ] A report of questions Ask the KB couldn't answer, so editors know what to write next
- [ ] Split long PDFs into several articles, and add a vector index for large knowledge bases
- [ ] Let a customer-facing chat bot use `/api/ask`, so the same articles power both agents and self-service

Having trouble running it? See [Troubleshooting](docs/how-it-works.md#troubleshooting).
