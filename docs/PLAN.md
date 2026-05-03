# Portfolio-Web Revival Plan

Generated: 2026-05-03

## Codebase snapshot

- **CMS:** Keystone v4 classic (personal fork: `github:aknoerig/keystone-classic`)
- **Runtime:** Node 18, npm 9
- **Database:** MongoDB (Mongoose 5)
- **Frontend:** Express + Pug templates
- **Build tooling:** Grunt 0.4.5 (broken on Node 12+, replaced by `npm start`)
- **Deployment:** Heroku (Procfile present)
- **14 data models:** Projects, Activities, Publications, Posts, Enquiries, + tag/category types
- **Third-party services:** Cloudinary (images), Embedly (media embeds), Google Maps (activity locations), email service (enquiry notifications)

## Known issues at time of writing

- `node_modules` absent — `npm install` not yet run
- `npm install` requires SSH access to `aknoerig` GitHub account (package-lock resolves keystone via `git+ssh://`)
- `grunt serve` permanently broken on Node 12+ (`--debug` flag removed, `node-inspector` removed)
- Hardcoded cookie secret in `keystone.js:33`
- Default admin password `password` in `updates/0.0.1-admins.js`
- No `.env.example` — required env vars undocumented
- Google Universal Analytics snippet (deprecated July 2023, no longer records data)
- New Relic configured with placeholder key and never `require`d

---

## Phase 1 — Get it running locally

**Goal:** `node keystone.js` reaches the admin UI and serves the site without crashes.

### 1.1 Verify SSH access (manual step)

```sh
ssh -T git@github.com   # must authenticate as aknoerig
```

If it fails, either load the correct SSH key or change `package.json` keystone entry to use HTTPS and delete `package-lock.json`:
```
"keystone": "github:aknoerig/keystone-classic"
```

### 1.2 Create `.env`

Copy `.env.example` to `.env` and fill in at minimum:
- `COOKIE_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `MONGO_URI` — defaults to `mongodb://127.0.0.1:27017/andreknoerig` for local dev
- `CLOUDINARY_URL` — required for image upload in admin; site renders without it

### 1.3 Start MongoDB

```sh
brew services start mongodb-community
# or: mongod --dbpath ~/data/db
```

Mongoose 5 is compatible with MongoDB 7 wire protocol.

### 1.4 Install and run

```sh
npm install
npm start   # http://localhost:3000 | admin at http://localhost:3000/keystone
```

First boot auto-seeds admin user from `updates/0.0.1-admins.js` via `'auto update': true`.

### 1.5 Verify Cloudinary degrades gracefully

Visit `/works` — the page should render without Cloudinary credentials. Only image uploads in the admin will fail.

---

## Phase 2 — Security

**Goal:** No secrets in source, no trivially compromised admin, basic transport security.

| # | Issue | File | Fix |
|---|-------|------|-----|
| 2.1 | Hardcoded `cookie secret` | `keystone.js:33` | Move to `process.env.COOKIE_SECRET`, add startup guard |
| 2.2 | Admin seed `password: 'password'` | `updates/0.0.1-admins.js` | Read from `process.env.ADMIN_PASSWORD` or generate random |
| 2.3 | No HTTPS in production | `keystone.js` | Add `'force ssl': process.env.NODE_ENV === 'production'` |
| 2.4 | New Relic placeholder key; not required | `newrelic.js` | Move to env; document as inactive |
| 2.5 | No security headers | `keystone.js` | Install `helmet`, register via `keystone.pre('routes', ...)` |
| 2.6 | Google/Embedly API keys not wired | `keystone.js` | Add to `keystone.init({...})` via `process.env` |

**Note on git history:** The old cookie secret is committed to history. Rotating to a new value (which moving to env accomplishes) invalidates all old sessions — that is the correct fix. A history rewrite is not needed.

---

## Phase 3 — Documentation

**Goal:** Any developer can clone and have a working local instance in under 15 minutes.

| # | Task | Output |
|---|------|--------|
| 3.1 | Create `.env.example` | All env vars with comments, clear required vs optional |
| 3.2 | Rewrite `README.md` | Stack, prerequisites, setup steps, admin URL, deploy notes |
| 3.3 | Expand `dev.md` | MongoDB management, env vars, why Grunt is broken, CSS workflow, Heroku checklist |
| 3.4 | Replace GA Universal Analytics with GA4 | `templates/layouts/default.pug` |

---

## Phase 4 — Keystone upgrade assessment

### The landscape

| Version | Status | Architecture |
|---|---|---|
| Keystone v4 (current) | Abandoned ~2018; this fork patches compatibility gaps | Mongoose 5, Express 4, Pug |
| Keystone v5 | Deprecated | Do not use |
| Keystone v6 | Current | TypeScript, GraphQL API, Next.js admin, Prisma ORM |

### What a v4 → v6 migration actually involves

This is a **full rewrite**, not an upgrade. There is no migration script or compatibility layer.

- Every model must be rewritten as TypeScript Prisma/v6 schema
- Field types `CloudinaryImage`, `Embedly`, `Location`, `Html` WYSIWYG, `Markdown` have no v6 equivalents — each needs a custom implementation
- The admin UI is a separate Next.js app; v4's admin navigation config has no equivalent
- All Express routes and Pug templates are irrelevant to v6
- The `keystone.Email` / Mandrill notification system does not exist in v6
- Official v6 targets PostgreSQL/SQLite; MongoDB is a community adapter

**Estimated effort for a faithful port: 3–5 weeks of focused work.**

### Recommendation: maintain v4, do not upgrade

**Reason 1:** The site's function (display portfolio content, manage via admin) is fully served by v4. Risk comes from vulnerable dependencies, not from the CMS version — and those are addressable at the dependency level.

**Reason 2:** v6 drops MongoDB as a first-class citizen. Migrating to PostgreSQL adds operational complexity with no user-visible benefit.

**Reason 3:** The personal fork already addresses the main compatibility gaps (Node 18, modern MongoDB driver, lodash). It is working software.

### What to do instead of upgrading

- Keep the lockfile, run `npm audit` periodically
- Patch CVEs in the fork as needed (precedent: already done in commit history)
- Replace Embedly (unreliable since Medium acquisition) with a direct oEmbed library if embed previews are needed
- Replace Universal Analytics with GA4 (already done in Phase 3)
- If a full rebuild is ever desired, use Keystone v6 as a headless CMS backend and build a modern Next.js frontend — that is a separate project, not an upgrade

---

## Files changed by this plan

| File | Phase | Change |
|------|-------|--------|
| `keystone.js` | 2.1, 2.3, 2.5, 2.6 | Cookie secret to env; HTTPS flag; helmet; API key wiring |
| `updates/0.0.1-admins.js` | 2.2 | Admin password from env or random |
| `newrelic.js` | 2.4 | License key from env |
| `templates/layouts/default.pug` | 3.4 | GA4 snippet replaces Universal Analytics |
| `.env.example` | 3.1 | New file — all env vars documented |
| `README.md` | 3.2 | Full rewrite |
| `dev.md` | 3.3 | Expanded setup and workflow guide |
| `package.json` | 2.5 | Add `helmet` dependency |
