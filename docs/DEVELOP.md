# Development Guide

## Setup

```sh
cp .env.example .env          # fill in at minimum COOKIE_SECRET
brew services start mongodb-community
npm install --ignore-scripts  # --ignore-scripts required on Apple Silicon (see below)
npm start
```

### Why `--ignore-scripts`

The keystone fork (`github:aknoerig/keystone-classic`) includes `chromedriver` as a test
dependency. Its postinstall script only supports Mac x64 and fails on Apple Silicon (arm64).
`--ignore-scripts` skips all postinstall scripts — safe here because we don't run tests from
the keystone fork and there are no native add-ons that need to compile.

### Node.js 25 compatibility

The engine spec targets Node.js 18. On Node.js 22+, `url.parse()` throws `ERR_INVALID_ARG_VALUE`
for comma-separated-host URIs. MongoDB driver 3.x generates these internally when resolving a
`mongodb+srv://` Atlas URI via DNS SRV lookup. A targeted monkey-patch at the top of `keystone.js`
suppresses the throw so the driver's own regex-based host parser can continue. The patch is safe on
all Node.js versions — it only activates on `ERR_INVALID_ARG_VALUE` for `mongodb://` multi-host URIs.

## Running the server

```sh
npm start                    # plain node — restart manually on changes
npx nodemon keystone.js      # auto-restart on file changes
```

**Do not use `grunt serve`.** The Grunt dev toolchain is broken on Node 12+:
- `grunt-nodemon` 0.4.0 passes `--debug` to node (removed in Node 12)
- `node-inspector` is referenced but not installed
The Grunt file is kept for historical reference only.

## Testing

Three test layers following the test pyramid:

```sh
npm test          # unit + integration (Jest)
npm run test:e2e  # end-to-end (Playwright / Chromium)
```

### Unit tests (`test/middleware.test.js`, `test/views.test.js`)

No database or server required. `keystone` is mocked at the module level so the suite starts in
under a second.

| File | Coverage |
|------|---------|
| `routes/middleware.js` | `initLocals`, `flashMessages`, `requireUser` |
| `routes/views/index.js` | section local, template name, project slice, empty-DB case |
| `routes/views/works.js` | section local, template name, category filter, findOne behaviour |
| `routes/views/contact.js` | section local, enquiry types, GET/POST flow, validation errors |
| `routes/views/blog.js` | section local, template name, category list, per-category post count |

`test/views.test.js` uses a `MockView` class that captures event handlers registered with
`view.on('init' | 'post' | 'render', ...)` and runs them via an async `renderPromise`, so each
controller can be exercised without a real Keystone `View` instance.

### Integration tests (`test/integration.test.js`)

Boots the full Keystone + Express stack against an in-memory MongoDB
([mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)), then hits it with
[supertest](https://github.com/ladjs/supertest). No external services required.

Covers: static page routes (200), data-driven routes with an empty DB (200), CSP header presence,
404 for unknown routes, and POST `/contact` Enquiry creation / missing-field rejection.

All models and view controllers are loaded through Jest's module registry to avoid the
cross-registry mismatch that `keystone.importer()` causes when running under Jest (it uses
Node's native `require` in `node_modules/` and ends up with a separate Keystone instance).

### End-to-end tests (`test/e2e/`)

Runs a real browser (Chromium) against a Keystone server started by `test/e2e/server.js` on
port 3001 with an in-memory MongoDB. Playwright manages the server lifecycle automatically.

```sh
npm run test:e2e
```

| Spec | What it checks |
|------|----------------|
| `navigation.spec.js` | Brand link, all four nav links, click navigation, active state per page |
| `pages.spec.js` | Page load status, headings, contact details, 404 for unknown routes |

The E2E server (`test/e2e/server.js`) is a plain Node script — `keystone.import('models')` and
`require('./routes')` work normally there because it runs outside Jest's module registry.

## Environment variables

Copy `.env.example` to `.env`. Required variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `COOKIE_SECRET` | Yes | 64-byte hex; generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `MONGO_URI` | Yes | Defaults to `mongodb://127.0.0.1:27017/andreknoerig` |
| `CLOUDINARY_URL` | Yes (startup) | Placeholder in `.env.example` keeps site bootable; uploads fail without real credentials |
| `EMBEDLY_API_KEY` | Yes (startup) | Placeholder keeps site bootable; embed previews fail without real key |
| `ADMIN_PASSWORD` | No | If unset, a random password is generated and printed on first boot |
| `GOOGLE_API_KEY` | No | Location geocoding on Activity pages |
| `MANDRILL_API_KEY` | No | Email delivery for contact form enquiries |
| `GA_PROPERTY` | No | GA4 Measurement ID (format: `G-XXXXXXXXXX`) |

## MongoDB

### Local management

```sh
brew services start mongodb-community   # start
brew services stop mongodb-community    # stop
brew services list                      # check status
mongosh andreknoerig                    # open shell on the database
```

### Database collections

| Collection | Purpose |
|------------|---------|
| `activities` | Activity content items |
| `enquiries` | Contact form submissions |
| `organizations` | Partner/client tags |
| `posts`, `postcategories` | Blog |
| `projectcategories`, `projects` | Portfolio work |
| `publicationcategories`, `publications` | Research/writing |
| `users` | Admin accounts |
| `_keystone_updates` | Tracks which seed scripts have run (do not modify manually) |

### Reset the admin seed

The admin seed in `updates/0.0.1-admins.js` runs only once. To re-run it (e.g., after wiping the DB):

```sh
mongosh andreknoerig --eval "db._keystone_updates.deleteOne({name: '0.0.1-admins'})"
npm start   # seed runs again on next boot
```

## CSS

The compiled stylesheet is `public/styles/site.min.css`. Source is in `public/styles/`. The
Grunt PostCSS task that compiled it is broken; to recompile manually after editing source CSS:

```sh
npx postcss public/styles/site.less --use autoprefixer -o public/styles/site.min.css
```

## Docker

```sh
cp .env.example .env   # fill in COOKIE_SECRET at minimum, as above
docker compose up --build
```

This builds the app image (Node 18, production deps only, installed with `--ignore-scripts`
for the same reason as local setup above) and starts it alongside a `mongo:5` container. The
compose file overrides `MONGO_URI` to point at the `mongo` service instead of the `.env`
default of `127.0.0.1`; every other variable comes from `.env`. Mongo data persists in the
`mongo-data` named volume across restarts.

- **Site:** http://localhost:3000
- **Admin UI:** http://localhost:3000/keystone

To run just the image against an external database (e.g. Atlas), build and run it directly:

```sh
docker build -t portfolio-web .
docker run --env-file .env -e MONGO_URI=<your-uri> -p 3000:3000 portfolio-web
```

### Convenience scripts

`./scripts/` wraps the common compose commands (they auto-detect `docker compose` vs. the
standalone `docker-compose` binary):

| Script | Does |
|--------|------|
| `docker-up.sh` | `compose up --build -d`, checks `.env` exists first |
| `docker-down.sh` | `compose down` (keeps the `mongo-data` volume) |
| `docker-logs.sh [service]` | tails logs, defaults to `app` |
| `docker-shell.sh` | shell into the running app container |
| `docker-mongo-shell.sh` | mongo shell on the `andreknoerig` db |
| `docker-build.sh` | builds the image without starting compose |
| `docker-reset.sh` | `compose down -v` — **deletes** the mongo-data volume, asks first |

## Deploying to Heroku

```sh
git push heroku master
```

Required Heroku config vars (set via `heroku config:set KEY=value` or the Heroku dashboard):

- `COOKIE_SECRET` — rotate from the local value; all sessions will be invalidated
- `CLOUDINARY_URL` — real Cloudinary credentials
- `EMBEDLY_API_KEY` — real Embedly key
- `ADMIN_PASSWORD` — set before first Heroku boot, or check logs for generated password
- `NODE_ENV=production` — enables HTTPS redirect and disables dev-only behaviours
- `MANDRILL_API_KEY` — for contact form email delivery
- `GA_PROPERTY` — GA4 Measurement ID

`MONGODB_URI` is provided automatically by the Heroku MongoDB add-on.

## Updating dependencies

```sh
npm outdated                # see what's stale
npm update                  # update within semver ranges
npx npm-check-updates       # see all possible upgrades (does not modify package.json)
npx npm-check-updates -u && npm install --ignore-scripts   # apply all upgrades
```

Run `npm audit` after any update and patch critical/high CVEs. For vulnerabilities inside
the `keystone-classic` fork, patch them directly in the fork at
`github.com/aknoerig/keystone-classic`.

## Upgrade path

See [docs/PLAN.md](docs/PLAN.md) Phase 4 for a full assessment. Short version: upgrading from
Keystone v4 to v6 is a full rewrite (3–5 weeks), not an in-place upgrade. The current fork is
maintained and sufficient for the site's needs.
