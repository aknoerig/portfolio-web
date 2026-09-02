#!/usr/bin/env bash
# Tail logs for a compose service. Defaults to "app".
# Usage: ./scripts/docker-logs.sh [service]
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh

"${COMPOSE[@]}" logs -f "${1:-app}"
