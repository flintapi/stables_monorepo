#!/bin/bash
set -euo pipefail

echo "Migrating database..."

npx drizzle-kit migrate --config ./drizzle.config.ts

# Execute the command passed to the container
exec "$@"
