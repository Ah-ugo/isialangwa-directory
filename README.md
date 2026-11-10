# Isialangwa South Contact & Polling Unit Directory

React + Vite + Chakra UI (v2) client, Express + Mongoose API, MongoDB Atlas.

## Run locally
```bash
# 1. API
cd server && cp .env.example .env     # fill MONGODB_URI and SESSION_SECRET (32+ chars)
npm install
# one-time: create the first Super Admin (no public registration exists)
SUPERADMIN_FULLNAME="Your Name" SUPERADMIN_USERNAME=superadmin SUPERADMIN_EMAIL=you@example.com \
SUPERADMIN_PASSWORD='a-long-passphrase-1' npm run create-superadmin
npm run dev                            # http://localhost:5000

# 2. Client (new terminal)
cd client && npm install && npm run dev   # http://localhost:5173 (proxies /api)
```
Optional dev-only fictitious data: `npm run seed:dev` (refuses to run when NODE_ENV=production).
Add the standard Isialangwa South wards to the configured MongoDB database with `cd server && npm run seed:wards`. This is safe to rerun and creates only missing wards; it does not add polling units or contact records.

## Deploy
- **API → Render** (Web Service, root `server`, build `npm install`, start `npm start`). Env: `NODE_ENV=production`, `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_URL=https://your-app.vercel.app`. Run `create-superadmin` once from the Render shell.
- **Client → Vercel** (root `client`, framework Vite). Production API calls use the same-origin `/api` rewrite in `client/vercel.json`; update its destination if the API deployment URL changes. Do not set `VITE_API_URL` in the Vercel client project.
- Cookies are `HttpOnly`, `Secure`, and `SameSite=None` in production. The same-origin rewrite keeps the browser session cookie first-party. Use HTTPS everywhere.

## Security model
- Every request reloads the user; deactivation, permission edits and password resets bump `tokenVersion`, ending sessions immediately.
- Permissions enforced in Express middleware and again at field level (phone / address / consent / photographs / voter-card images are stripped from responses unless permitted).
- Only the Super Admin can create/edit/deactivate admins; the Super Admin account can't be modified or deactivated through the API.
- bcrypt (cost 12), login rate limit + 5-strike 15-minute lockout, Helmet, CORS allow-list, Origin check on writes, Mongo-operator stripping, body size limits, Zod validation, ObjectId validation, append-only audit log, CSV formula-injection escaping.

## Privacy by design
Consent is required to save a contact; withdrawal disables call/WhatsApp and is logged. No PVC images, bank details, or political fields exist. Call/WhatsApp only open the device dialler / `wa.me` — nothing is sent automatically and there is no bulk messaging. Complete a Nigeria Data Protection Act 2023 assessment (lawful basis, privacy notice, retention) before collecting real data.

## Notes / deliberate choices
- Chakra UI **v2** used consistently (its toast is the "Toaster").
- Admin onboarding uses a one-time temporary password (shown once) instead of email invitations.
- Call/WhatsApp require *View phone numbers* plus the action permission.
- Cloudinary env vars are reserved but unused: no profile images are collected.
