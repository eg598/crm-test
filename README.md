# Service Desk — Ticket Management System

A production-ready full-stack CRM / Service Desk application with role-based access control, ticket lifecycle management, a Kanban board, and bulk data import.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, SCSS (BEM), Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Sequelize ORM |
| Auth | JWT (8 h expiry), bcrypt |

---

## Features

- **Role-based access control** — Admin / Supervisor / Operator with all permissions enforced on the backend
- **Ticket lifecycle** — create, assign, prioritize, track status, close
- **Supervisor-driven assignment** — tickets start unassigned; supervisor sets operator and priority
- **Operator execution model** — operators see only their assigned tickets; status changes restricted to `in_progress`, `waiting`, `resolved`
- **Client management** — full CRUD with search and validation
- **Kanban board** — native HTML5 drag-and-drop, role-aware column restrictions
- **Comments and activity history** — full audit trail on every ticket
- **Operator Workload dashboard** — per-operator ticket counts, workload indicator, inline reassignment
- **Import system** — bulk import users and tickets from JSON files
- **Cursor-based pagination** — designed for 10 000+ ticket datasets
- **Responsive design** — mobile-friendly layout with collapsible sidebar

---

## Roles

### Admin
Manages the user base. Has no involvement in ticket operations.

| Permission | Access |
|---|---|
| Create / edit / delete users | ✅ |
| Import users from JSON | ✅ |
| Import tickets from JSON | ✅ |
| Create / edit clients | ✅ |
| Delete clients | ✅ |
| Delete tickets | ✅ |
| Create or assign tickets | ❌ |
| Update ticket status | ❌ |

### Supervisor
Owns the ticket workflow end-to-end.

| Permission | Access |
|---|---|
| Create tickets | ✅ |
| Set / change priority | ✅ |
| Assign operator to ticket | ✅ |
| Full ticket edit (all fields) | ✅ |
| Update status (any value) | ✅ |
| Delete tickets | ✅ |
| View all tickets | ✅ |
| Add comments | ✅ |
| Operator workload page | ✅ |

### Operator
Executes assigned tickets only.

| Permission | Access |
|---|---|
| View assigned tickets | ✅ |
| Update status (`in_progress` / `waiting` / `resolved`) | ✅ (own tickets only) |
| Add comments | ✅ (own tickets only) |
| Create or assign tickets | ❌ |
| Change priority | ❌ |
| Access unassigned tickets | ❌ (enforced at DB query level) |

> All permissions are enforced on the **backend** — the frontend never hides the only layer of protection.

---

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### 1. Clone the repository

```bash
git clone https://github.com/eg598/crm-test.git
cd crm-test
```

### 2. Create the database

```bash
createdb servicedesk
```

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if your PostgreSQL credentials differ from the defaults
npm run dev
```

The API server starts on **http://localhost:4000**. On first run, Sequelize auto-creates all tables via `sync({ alter: true })`.

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

### `backend/.env`

```env
PORT=4000
DB_NAME=servicedesk
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
JWT_SECRET=changeme_super_secret_32chars
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Demo Data

### Option A — seed script (creates users + clients + 20 tickets)

```bash
cd backend
npm run db:seed
```

### Option B — JSON import (recommended for large-scale testing)

The `docs/` folder contains ready-to-use import files.

#### Import users

1. Log in as **Admin**
2. Go to **Users** page
3. Click **Import JSON**
4. Select `docs/sample-users.json`

This creates 4 accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@desk.com | admin123 |
| Supervisor | supervisor@desk.com | supervisor123 |
| Operator 1 | operator1@desk.com | operator123 |
| Operator 2 | operator2@desk.com | operator123 |

#### Import tickets

1. Log in as **Admin**
2. Go to **Tickets** page
3. Click **Import JSON**
4. Select `docs/sample-tickets-100.json` (100 tickets) or `docs/sample-tickets-1000.json` (1 000 tickets)

Tickets reference clients by email — import users and run the seed script first so clients exist in the database.

#### JSON formats

**Users (`docs/sample-users.json`)**
```json
[
  {
    "name": "John Operator",
    "email": "operator1@desk.com",
    "password": "operator123",
    "role": "operator"
  }
]
```

**Tickets (`docs/sample-tickets-100.json`)**
```json
[
  {
    "title": "Login page not loading",
    "description": "Users cannot access the login page",
    "category": "Bug",
    "priority": "high",
    "status": "new",
    "deadline": "2026-08-30T12:00:00.000Z",
    "clientEmail": "tom@acme.com",
    "assignedEmail": "operator1@desk.com"
  }
]
```

All fields except `title` are optional. Unknown emails are silently skipped (ticket created without client / assignment).

---

## Scripts

### Backend

```bash
npm run dev        # Start dev server with hot reload (ts-node-dev)
npm run build      # Compile TypeScript → dist/
npm start          # Run compiled output
npm run db:seed    # Populate database with demo data
```

### Frontend

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run type-check # TypeScript check without emit
```

---

## API Overview

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Returns JWT token + user object |
| GET | `/me` | Bearer | Returns current authenticated user |

### Users — `/api/users`

All routes require authentication. Write operations require `admin` role.

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/` | supervisor, admin | List all users |
| POST | `/` | admin | Create user |
| POST | `/import` | admin | Bulk import from JSON array |
| PUT | `/:id` | admin | Update user |
| DELETE | `/:id` | admin | Delete user |

### Clients — `/api/clients`

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/` | all | List clients (search + pagination) |
| GET | `/:id` | all | Get client with linked tickets |
| POST | `/` | supervisor, admin | Create client |
| PUT | `/:id` | supervisor, admin | Update client |
| DELETE | `/:id` | admin | Delete client |

### Tickets — `/api/tickets`

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/` | all* | List tickets (cursor pagination, filters) |
| POST | `/import` | admin | Bulk import from JSON array |
| GET | `/:id` | all* | Get ticket with history |
| POST | `/` | supervisor | Create ticket |
| PUT | `/:id` | supervisor | Full update (metadata, priority) |
| PATCH | `/:id/status` | supervisor, operator* | Update status |
| PATCH | `/:id/assign` | supervisor | Assign operator |
| DELETE | `/:id` | supervisor, admin | Delete ticket |
| GET | `/:id/comments` | all* | List comments |
| POST | `/:id/comments` | supervisor, operator* | Add comment |

\* Operators are scoped to their assigned tickets only — enforced at the database query level, not just UI.

---

## Notes

- **Backend-enforced RBAC** — every permission check exists as middleware or service-layer logic. Bypassing the frontend (e.g. via Postman) still returns `401`/`403` for unauthorized actions.
- **Performance** — ticket listing uses cursor-based pagination (`WHERE id > cursor`) for stable performance on large datasets. The 1 000-ticket import file is provided specifically to test filtering, search, and Kanban under load.
- **Audit trail** — every status change, reassignment, and metadata edit is recorded in `TicketHistories` with the acting user and timestamp.
- **No WebSocket dependency** — real-time feel is achieved through immediate state refresh after every mutation (optimistic UI + server re-fetch).
