#!/bin/bash
set -euo pipefail

echo "Migrating database"

pnpm run db:migrate:services:synapse || pnpm run db:migration

# Execute the command passed to the container
exec "$@"
