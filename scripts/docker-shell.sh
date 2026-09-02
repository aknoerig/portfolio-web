#!/usr/bin/env bash
# Open a shell in the running app container.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh

"${COMPOSE[@]}" exec app sh
