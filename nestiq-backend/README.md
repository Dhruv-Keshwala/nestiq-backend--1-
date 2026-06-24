# NESTIQ Backend — Auth API (Express + PostgreSQL)

A production-style authentication backend: Express, PostgreSQL (`pg`), bcrypt
password hashing, JWT sessions, rate limiting, and centralized error handling.

## 1. Install

```bash
cd nestiq-backend
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set:

```
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/nestiq
JWT_SECRET=<a long random string — generate with: openssl rand -hex 32>
```

Leave `PORT=4000` as-is to match your frontend's expected backend URL.

## 3. Create the database

```bash
# inside psql, or any Postgres GUI (pgAdmin, TablePlus, etc.)
CREATE DATABASE nestiq;
```

## 4. Run the migration (creates `users` + `sessions` tables)

```bash
npm run migrate
```

You should see:
```
✅ Migration complete — users & sessions tables are ready.
```

## 5. Start the server

```bash
npm start
```

or, with auto-restart on file changes:

```bash
npm run dev
```

You should see:
```
🐘 PostgreSQL connected — server time: ...
🏠 NESTIQ Auth API running on http://localhost:4000
```

## 6. Test it

```bash
curl http://localhost:4000/api/health

curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Mehta","email":"aarav@example.com","password":"SuperSecret123"}'

curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aarav@example.com","password":"SuperSecret123"}'
```

---

## API Reference

All responses are JSON with a `success` boolean. On failure, `message`
(and sometimes `errors`, a field → message map) explain what went wrong.

### `POST /api/auth/register`
**Body:** `{ name, email, password, phone? (optional, Indian format), role? ("renter"|"buyer"|"agent", default "renter") }`
**201:** `{ success: true, data: { user, token, password_strength } }`
**400:** validation errors · **409:** email already registered

### `POST /api/auth/login`
**Body:** `{ email, password }`
**200:** `{ success: true, data: { user, token } }`
**401:** invalid credentials · **423:** account locked (5 failed attempts → 15 min lock) · **403:** account deactivated

Rate limited: 5 attempts / 15 minutes per IP (configurable in `.env`).

### `GET /api/auth/me`
**Header:** `Authorization: Bearer <token>`
**200:** `{ success: true, data: { user } }` · **401:** missing/invalid/expired token, or session was logged out

### `POST /api/auth/logout`
**Header:** `Authorization: Bearer <token>`
Revokes the session server-side (the token is recorded as inactive in the `sessions` table), so it can no longer be used even though the JWT itself hasn't technically expired.

### `GET /api/auth/check-email?email=someone@example.com`
**200:** `{ success: true, data: { available: true|false } }`
Used by the sign-up form to show "this email is taken" before submit.

---

## Project structure

```
src/
  app.js                  Express app: middleware + route mounting
  server.js               Entry point — connects to DB, starts listening
  config/
    db.js                 pg Pool connection
    schema.sql            CREATE TABLE statements
    migrate.js            Runs schema.sql (npm run migrate)
  models/
    userModel.js          All SQL for the users table
    sessionModel.js        All SQL for the sessions table
  controllers/
    authController.js     register / login / me / logout / checkEmail
  middleware/
    auth.js                requireAuth, requireRole
    errorHandler.js        centralized error responses + asyncHandler
  routes/
    authRoutes.js           /api/auth/* route definitions
  utils/
    password.js            bcrypt hash/verify
    jwt.js                  sign/verify
    validate.js             input validation
```

## Security notes

- Passwords are hashed with bcrypt (cost factor 12, configurable).
- Login responses never reveal whether the *email* or the *password* was
  wrong — only "Invalid email or password."
- 5 failed login attempts locks the account for 15 minutes (both configurable
  via `.env`).
- `password_hash`, `failed_login_attempts`, and `locked_until` are always
  stripped before a user object is sent to the client.
- CORS is wide open (`*`) for local development — **lock `CORS_ORIGIN` down
  to your real frontend domain before deploying to production.**
- `JWT_SECRET` in `.env.example` is a placeholder — generate a real one
  (`openssl rand -hex 32`) before going live, and never commit `.env`.

## Going further

- Add `phone` OTP verification / forgot-password flows — stub them in
  `authController.js` and wire in an email/SMS provider (e.g. SendGrid, Twilio).
- Add `requireRole("admin")` to any future admin-only route using the
  middleware already provided in `src/middleware/auth.js`.
