#!/bin/bash
# This script runs on PostgreSQL container initialization
# It ensures the postgres user password is set correctly

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';
EOSQL

echo "PostgreSQL password synchronized successfully"

