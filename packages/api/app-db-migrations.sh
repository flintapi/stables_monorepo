#!/usr/bin/env bash
set -euo pipefail

echo "Migrating database..."

ls -al

pnpm run --filter @flintapi/api db:migrate

# Execute the command passed to the container
exec "$@"
