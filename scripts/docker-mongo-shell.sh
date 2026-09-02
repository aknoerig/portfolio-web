#!/usr/bin/env bash
# Open a mongo shell on the compose MongoDB, connected to the andreknoerig db.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh

"${COMPOSE[@]}" exec mongo mongo andreknoerig
