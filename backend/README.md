# Taska Backend

A REST API for Taska: users register, log in, and manage their own tasks
(create, read, update, delete, mark complete). Built with Express and
PostgreSQL.

## Stack

- **Runtime**: Node.js + Express 5
- **Database**: PostgreSQL, accessed via raw SQL through `pg` (no ORM)
- **Auth**: JWT (stateless), passwords hashed with bcrypt
- **Tests**: Jest + Supertest

## Project structure

```text
src/
├── config/       # env loading, database pool
├── controllers/  # request handlers
├── db/           # SQL migrations + migration runner
├── middleware/    # auth guard, centralized error handler
├── models/       # SQL queries (users, tasks)
├── routes/       # route -> controller wiring
├── utils/        # AppError, asyncHandler, jwt, password hashing
├── validators/   # request validation
├── app.js        # express app (no listen — used directly by tests)
└── server.js     # starts the HTTP server
tests/            # Jest + Supertest integration tests
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (see `.env.example` for the full list):

   ```bash
   cp .env.example .env
   ```

   Set `PGPASSWORD` to your local PostgreSQL password and generate a
   real `JWT_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

3. Create the database (if it doesn't exist) and run migrations:

   ```sql
   CREATE DATABASE taska_dev;
   ```

   ```bash
   npm run migrate
   ```

## Running

```bash
npm start        # production mode
npm run dev      # auto-restart on file changes (nodemon)
```

The server listens on `PORT` (default `3000`).

## Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `test` loads `.env.test` instead of `.env` |
| `PORT` | No | `3000` | |
| `CORS_ORIGIN` | No | `*` | Set to your frontend's origin in production |
| `PGHOST` | Yes | — | |
| `PGPORT` | No | `5432` | |
| `PGUSER` | Yes | — | |
| `PGPASSWORD` | Yes | — | |
| `PGDATABASE` | Yes | — | |
| `JWT_SECRET` | Yes | — | Long random string; never commit this |
| `JWT_EXPIRES_IN` | No | `7d` | |

## Tests

Tests run against a separate `taska_test` database (never your dev data).

```sql
CREATE DATABASE taska_test;
```

Configure `.env.test` (see the checked-in one for local defaults), then:

```bash
npm test
```

Each test file truncates `users`/`tasks` before every test, so the suite
is repeatable. Migrations run automatically at the start of the test run.

## Authentication flow

1. `POST /auth/register` — create an account, returns a JWT.
2. `POST /auth/login` — exchange email/password for a JWT.
3. Send `Authorization: Bearer <token>` on every subsequent request to
   `/tasks/*` and `/auth/me`.
4. The server resolves the token to a user on every request; tasks are
   always scoped to `req.user.id` at the SQL level, so one user can never
   read, edit, or delete another user's tasks (they get `404`, not `403`,
   to avoid leaking task existence).

Passwords are hashed with bcrypt before storage; the hash is never
returned in any API response.

## API reference

All responses are JSON. Errors look like:

```json
{ "error": { "message": "Human readable message", "details": ["optional", "list"] } }
```

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Liveness check |

### Auth

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | No | `{ name, email, password }` | Create account, returns `{ user, token }` |
| POST | `/auth/login` | No | `{ email, password }` | Returns `{ user, token }` |
| GET | `/auth/me` | Yes | — | Returns the authenticated user |

**Register example**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'
```

```json
{
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "created_at": "...", "updated_at": "..." },
  "token": "eyJhbGciOi..."
}
```

### Tasks (all require `Authorization: Bearer <token>`)

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/tasks` | `{ title, description?, status?, priority?, dueDate? }` | Create a task |
| GET | `/tasks` | — | List the current user's tasks. Query params: `status`, `priority`, `search` |
| GET | `/tasks/:id` | — | Get one task |
| PUT`/`PATCH | `/tasks/:id` | any subset of `{ title, description, status, priority, dueDate }` | Update a task |
| PATCH | `/tasks/:id/status` | `{ status }` | Change only the status (e.g. mark completed) |
| DELETE | `/tasks/:id` | — | Delete a task (`204 No Content`) |

Valid `status` values: `pending`, `in_progress`, `completed`.
Valid `priority` values: `low`, `medium`, `high`.

**Create task example**

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Write report","priority":"high"}'
```

**Mark a task completed**

```bash
curl -X PATCH http://localhost:3000/tasks/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no content (delete) |
| 400 | Validation error / malformed request |
| 401 | Missing, invalid, or expired auth token; wrong credentials |
| 404 | Resource doesn't exist, or doesn't belong to the current user |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Unexpected server error (never exposes internals) |

## Database schema

- `users`: `id, name, email (unique), password_hash, created_at, updated_at`
- `tasks`: `id, user_id (FK -> users.id, ON DELETE CASCADE), title, description, status, priority, due_date, created_at, updated_at`

Migrations live in `src/db/migrations/` as plain SQL files, tracked in a
`schema_migrations` table so `npm run migrate` only applies what's new.
Add a new migration by creating the next numbered `.sql` file — never
edit an already-applied one.
