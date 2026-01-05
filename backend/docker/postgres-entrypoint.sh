#!/bin/bash
set -e

# Custom PostgreSQL entrypoint that ensures password is synced BEFORE container is healthy
# This eliminates the race condition where backend connects before password is set

READY_FLAG="/tmp/.postgres_password_ready"

# Remove ready flag on startup
rm -f "$READY_FLAG"

# Start PostgreSQL in background using original entrypoint
docker-entrypoint.sh postgres &
PG_PID=$!

# Wait for PostgreSQL to be ready to accept connections
echo "Waiting for PostgreSQL to start..."
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q; do
    sleep 1
done

echo "PostgreSQL is accepting connections. Syncing password..."

# Sync the password from environment variable
# This ensures password matches even if volume already existed
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
    ALTER USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';
EOSQL

echo "Password synchronized successfully!"

# Create ready flag - healthcheck will look for this
touch "$READY_FLAG"
echo "Ready flag created. Container is now fully ready."

# Wait for PostgreSQL process
wait $PG_PID

