#!/usr/bin/env bash
# Build and start the app + MongoDB in the background.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh

if [ ! -f .env ]; then
	echo "No .env found — copy .env.example to .env and fill in COOKIE_SECRET first." >&2
	exit 1
fi

"${COMPOSE[@]}" up --build -d "$@"
echo
echo "Site:     http://localhost:3000"
echo "Admin UI: http://localhost:3000/keystone"
echo "Logs:     ./scripts/docker-logs.sh"
