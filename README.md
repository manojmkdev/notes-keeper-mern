# Notes Keeper — Full Stack MERN App 📝

A full-stack note-taking app: **React** frontend + **Express/Node** backend + **MongoDB Atlas** database, with **bcrypt**-hashed passwords and **JWT** authentication.

This started as a frontend-only app (localStorage-based). It has been converted into a complete MERN stack app:

- **M**ongoDB Atlas — cloud database, stores users, notes, notebooks, tags
- **E**xpress — REST API server (`/server`)
- **R**eact — frontend UI (`/src`)
- **N**ode.js — backend runtime

---

## 📂 Project Structure

```
notes-keeper/
├── src/                  # React frontend
│   ├── components/
│   ├── pages/
│   └── utils/
│       ├── api.js        # axios instance + JWT header injection
│       └── notesApi.js   # typed wrapper functions for every API call
├── server/                # Express + MongoDB backend  (NEW)
│   ├── config/db.js       # MongoDB Atlas connection
│   ├── models/            # Mongoose schemas (User, Note, Notebook, Tag)
│   ├── middleware/        # JWT auth guard + error handler
│   ├── controllers/       # Route logic
│   ├── routes/            # Express routers
│   ├── server.js          # App entry point
│   └── .env.example
├── .env.example            # Frontend env vars
└── package.json
```

---

## ✅ Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer (`node -v`)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account (or a local MongoDB install)
- npm (comes with Node)

---

## 1. Set up MongoDB Atlas

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free (M0) cluster.
2. Under **Database Access**, create a database user with a username/password (remember these).
3. Under **Network Access**, add your current IP (or `0.0.0.0/0` for testing) to the IP Access List.
4. Click **Connect** → **Drivers** on your cluster, and copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Add a database name to the string right after `.net/`, e.g. `.../notes-keeper?retryWrites=...` — that's the URI you'll use below.

---

## 2. Backend setup (`/server`)

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in real values:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/notes-keeper?retryWrites=true&w=majority
JWT_SECRET=some_long_random_string_here
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

> Generate a strong `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Start the backend:

```bash
npm run dev     # with nodemon (auto-restart on changes)
# or
npm start       # plain node
```

You should see:
```
MongoDB Atlas connected: cluster0-shard-...mongodb.net
Notes Keeper API running on port 5000
```

If you instead see a connection error, double check your `MONGO_URI`, database user credentials, and that your IP is allow-listed in Atlas Network Access.

---

## 3. Frontend setup (project root)

Open a **second terminal** (leave the backend running in the first):

```bash
cd notes-keeper        # project root, NOT the server folder
npm install --legacy-peer-deps
cp .env.example .env
```

`.env` at the project root should look like:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GEMINI_API_KEY=your_google_gemini_api_key_here   # optional, only for "Fix with AI"
```

> Note: `--legacy-peer-deps` is required because this project depends on both `react-quill` and `react-quill-new`, which declare slightly different peer ranges for React 19. This is unrelated to the backend changes.

Start the frontend:

```bash
npm start
```

The app opens at `http://localhost:3000`.

---

## 4. Verify everything works

### A. Quick API health check
With the backend running, in a terminal:
```bash
curl http://localhost:5000/api/health
# -> {"status":"ok"}
```

### B. Verify bcrypt + signup via curl
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```
You should get back a `token` and a `user` object **without** a `password` field. In MongoDB Atlas (Collections → notes-keeper → users), you'll see the stored user has a long `$2a$...` bcrypt hash in `password`, never the plaintext.

### C. Verify login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
Copy the returned `token` value for the next step.

### D. Verify a protected route
```bash
curl http://localhost:5000/api/notes \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
# -> []   (empty array — no notes yet)
```
Calling this without a token (or with a bad one) should return a `401 Not authorized` response.

### E. Full UI walkthrough
1. Go to `http://localhost:3000` → you're redirected to `/login`.
2. Click **Sign up**, create an account. You should land back on the login page with a success toast.
3. Log in with those credentials → redirected to **All Notes**.
4. Click **+ New Note**, type a title/content, close the editor → the note appears (data is now saved in MongoDB Atlas, not localStorage).
5. Go to **Notebooks**, create a notebook; go to **Tags**, create a tag with a color.
6. Back in **All Notes**, edit your note and assign the notebook + tag — confirm the badges show up on the note card.
7. Pin, archive, then check the **Archive** page; delete a note and check **Trash**; restore it or empty the trash.
8. Go to **Profile**, change your name and/or password, save, then log out and log back in with the new password to confirm it took effect.
9. Refresh the browser on any authenticated page — you should stay logged in (JWT persisted in `localStorage` under `nk_token`).
10. In Atlas, open **Collections** and confirm `users`, `notes`, `notebooks`, and `tags` documents exist and are scoped to your user's `_id`.

If all of the above works, your MERN stack (React ↔ Express ↔ MongoDB Atlas, with bcrypt password hashing and JWT auth) is fully wired up.

---

## 🔐 How authentication works

- **Signup**: password is hashed with `bcryptjs` (10 salt rounds) in `User` model's `pre('save')` hook before it ever touches the database — plaintext passwords are never stored.
- **Login**: submitted password is compared against the stored hash using `bcrypt.compare` — the hash is never sent back to the client.
- **Session**: on successful signup/login, the server signs a JWT (`jsonwebtoken`) containing the user's id, valid for `JWT_EXPIRES_IN` (default 7 days). The frontend stores this token in `localStorage` (`nk_token`) and attaches it as `Authorization: Bearer <token>` on every API request (see `src/utils/api.js`).
- **Protected routes**: the `protect` middleware (`server/middleware/auth.js`) verifies the JWT on every request to `/api/notes`, `/api/notebooks`, `/api/tags`, and `/api/auth/me` / `/api/auth/profile`. Every note/notebook/tag is scoped server-side to the authenticated user's id — there is no way for one user to read or modify another user's data through the API.

---

## 🛠️ API Reference

All routes are prefixed with `/api`. Routes marked 🔒 require `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create account (bcrypt-hashes password) |
| POST | `/auth/login` | Log in, returns JWT |
| GET  | `/auth/me` 🔒 | Get current user |
| PUT  | `/auth/profile` 🔒 | Update name / password |
| GET  | `/notes` 🔒 | List all of the user's notes |
| POST | `/notes` 🔒 | Create a note |
| PUT  | `/notes/:id` 🔒 | Update a note |
| PATCH | `/notes/:id/archive` 🔒 | Toggle archived |
| PATCH | `/notes/:id/pin` 🔒 | Toggle pinned |
| PATCH | `/notes/:id/restore` 🔒 | Restore from Trash |
| DELETE | `/notes/:id` 🔒 | Soft-delete (Trash); add `?permanent=true` to delete forever |
| DELETE | `/notes/trash/clear` 🔒 | Empty Trash |
| DELETE | `/notes/reset-data` 🔒 | Wipe all of the user's notes/notebooks/tags |
| GET/POST/PUT/DELETE | `/notebooks`, `/notebooks/:id` 🔒 | Notebook CRUD |
| GET/POST/PUT/DELETE | `/tags`, `/tags/:id` 🔒 | Tag CRUD |

---

## 🚀 Deployment notes

- **Backend**: deploy `/server` to Render, Railway, Fly.io, or similar. Set the same env vars as `.env` (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CLIENT_ORIGIN` — set `CLIENT_ORIGIN` to your deployed frontend URL).
- **Frontend**: deploy the project root to Vercel/Netlify as before (`vercel.json` is already present). Set `REACT_APP_API_URL` to your deployed backend's `/api` URL in the platform's environment variable settings, then rebuild.
- Never commit real `.env` files — only the `.env.example` templates are included in this repo.

---

## 📄 License

MIT
