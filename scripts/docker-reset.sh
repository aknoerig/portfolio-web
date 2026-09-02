#!/usr/bin/env bash
# Stop the stack and DELETE the mongo-data volume (wipes the database). Asks first.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/_compose.sh

read -r -p "This deletes all data in the mongo-data volume. Continue? [y/N] " reply
case "$reply" in
	[yY]|[yY][eE][sS]) ;;
	*) echo "Aborted."; exit 1 ;;
esac

"${COMPOSE[@]}" down -v
