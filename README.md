# André Knörig — Portfolio

Personal portfolio and CMS at [andreknoerig.de](https://andreknoerig.de).

## Stack

- **CMS:** [Keystone v4 classic](https://github.com/aknoerig/keystone-classic) (personal fork)
- **Runtime:** Node.js 18+, npm 9+
- **Database:** MongoDB 5+
- **Templates:** Pug (server-rendered)
- **Services:** Cloudinary (images), Embedly (embeds), Google Maps (activity locations)
- **Hosting:** Heroku

## Prerequisites

- Node.js 18 or higher
- MongoDB 5 or higher (locally via Homebrew: `brew install mongodb-community`)
- npm 9 or higher

## Local setup

```sh
# 1. Clone and enter the repo
git clone git@github.com:aknoerig/portfolio-web.git
cd portfolio-web

# 2. Set up environment variables
cp .env.example .env
# Open .env and fill in COOKIE_SECRET at minimum.
# Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Cloudinary and Embedly come with placeholder values that keep the site bootable.

# 3. Start MongoDB
brew services start mongodb-community

# 4. Install dependencies
# --ignore-scripts is required: the keystone fork includes chromedriver
# as a test dep whose install script fails on Apple Silicon.
npm install --ignore-scripts

# 5. Start the server
npm start
```

- **Site:** http://localhost:3000
- **Admin UI:** http://localhost:3000/keystone

On first boot, `auto update` runs `updates/0.0.1-admins.js`, which seeds an admin user at `admin@andreknoerig.de`. The password is printed to stdout if `ADMIN_PASSWORD` is not set in `.env`.

## Development

`npm start` runs `node keystone.js` directly. For auto-restart on file changes:

```sh
npx nodemon keystone.js
```

The Grunt dev toolchain (`grunt serve`) is **broken** on Node 12+ and should not be used. See [dev.md](dev.md) for details.

```sh
npm test   # unit tests (no database required)
```

## Deployment (Heroku)

```sh
git push heroku master
```

Set all non-placeholder variables from `.env.example` as Heroku config vars. MongoDB is provided automatically via the Heroku MongoDB add-on as `MONGODB_URI` — no need to set `MONGO_URI` manually on Heroku.

## Content model

| Model | Purpose |
|-------|---------|
| Project | Portfolio work items |
| Activity | Events, workshops, talks |
| Publication | Research and writing |
| Post | Blog posts |
| Enquiry | Contact form submissions (read-only, triggers email) |
| Organization | Partner and client tags |
| Technology / Industry / Interaction | Taxonomy tags |

See [dev.md](dev.md) for database and workflow details.
