#!/usr/bin/env bash
set -euo pipefail

echo "Migrating database..."

ls -al

pnpm run db:migrate

# Execute the command passed to the container
exec "$@"
