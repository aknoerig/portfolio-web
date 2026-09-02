#!/usr/bin/env bash
# Build the portfolio-web image without starting compose.
set -euo pipefail
cd "$(dirname "$0")/.."

docker build -t portfolio-web "$@" .
