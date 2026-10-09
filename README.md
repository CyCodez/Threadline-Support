# Threadline

Threadline is a small, production-oriented customer support workspace built around a simple idea:

**Customers should be able to explain a problem naturally, and support staff should receive enough context to solve it without making the customer repeat themselves.**

The project is intentionally designed around real SaaS support behaviour rather than a generic CRUD dashboard.

## Stack

### Frontend
- React
- React Router
- Vite
- Plain CSS

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- HTTP-only cookies
- bcryptjs
- Helmet
- CORS
- Express Rate Limit

## Product workflow

Customer:
1. Register/login
2. Start a support conversation
3. Explain what happened
4. Explain what they expected
5. Mention what they already tried
6. Follow the conversation
7. Close a resolved request

Support agent:
1. Sign in
2. View support queue
3. Filter by status/priority/category
4. Open a conversation
5. Review customer context
6. Reply to the customer
7. Add private internal notes
8. Assign the request
9. Move the request through its support lifecycle

## Project structure

```text
threadline/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── README.md
```

## Setup

### 1. Backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and set:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173

SEED_AGENT_NAME=Support Agent
SEED_AGENT_EMAIL=agent@threadline.local
SEED_AGENT_PASSWORD=ChangeMe123!
```

Start:

```bash
npm run dev
```

### 2. Seed an agent

With MongoDB configured:

```bash
npm run seed:agent
```

This creates an agent account using the credentials in `.env`.

Change the password before using the application beyond local development.

### 3. Frontend

In another terminal:

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Local accounts

Customer accounts can be created from the registration page.

The support agent is created with:

```text
agent@threadline.local
ChangeMe123!
```

unless you change the `.env` values.

## API

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Tickets

```text
POST   /api/tickets
GET    /api/tickets/mine
GET    /api/tickets/queue
GET    /api/tickets/:id
PATCH  /api/tickets/:id
PATCH  /api/tickets/:id/assign
```

### Messages

```text
GET  /api/tickets/:id/messages
POST /api/tickets/:id/messages
```

### Customer context

```text
GET /api/tickets/:id/customer-context
```

### Admin

```text
GET /api/admin/overview
```

## Important note

This is a serious portfolio project and is intentionally much closer to a real support product than a tutorial CRUD app. Before exposing it publicly as a production service, add a managed file/object-storage solution, email verification, password reset, automated tests, audit logging, observability, CI/CD and a proper production database/security review.

Do not commit `.env`.
