#!/usr/bin/env bash
# Stop the app + MongoDB. Keeps the mongo-data volume — use docker-reset.sh to wipe it.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh

"${COMPOSE[@]}" down "$@"
