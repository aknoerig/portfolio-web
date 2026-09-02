# Sourced by scripts/docker-*.sh. Resolves the available compose command into
# the COMPOSE array, since some hosts only have the `docker compose` plugin and
# others only have the standalone `docker-compose` binary.

if docker compose version >/dev/null 2>&1; then
	COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
	COMPOSE=(docker-compose)
else
	echo "Neither 'docker compose' nor 'docker-compose' is available on this machine." >&2
	exit 1
fi
