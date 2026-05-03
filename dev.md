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

## Running the server

```sh
npm start                    # plain node — restart manually on changes
npx nodemon keystone.js      # auto-restart on file changes
```

**Do not use `grunt serve`.** The Grunt dev toolchain is broken on Node 12+:
- `grunt-nodemon` 0.4.0 passes `--debug` to node (removed in Node 12)
- `node-inspector` is referenced but not installed
The Grunt file is kept for historical reference only.

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
| `NEW_RELIC_LICENSE_KEY` | No | APM monitoring; agent is inactive unless `require('newrelic')` is added to `keystone.js` |

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
