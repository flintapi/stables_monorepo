#!/bin/bash
set -euo pipefail

echo "Migrating database..."

ls -al

cd packages/api && pnpm run db:migrate

# Execute the command passed to the container
exec "$@"
