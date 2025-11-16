FROM node:20-alpine AS builder

WORKDIR /app

COPY ../../pnpm-lock.yaml ../../package*.json ./
COPY ../../pnpm-workspace.yaml ./

RUN npm install -g pnpm

COPY ../../packages/shared ./packages/shared
COPY ../../packages/api ./packages/api
COPY ../../turbo.json ./

RUN pnpm install

RUN pnpm run build:packages:api

# Production build :runner

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json

# Copy over service folder and files
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/api/dist ./packages/api/dist
# COPY --from=builder /app/services/ramp/src/db/migrations ./services/ramp/dist/src/db/migrations
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json
# COPY --from=builder /app/packages/api/app-db-migrations.sh /usr/local/bin/app-db-migrations.sh
# RUN chmod +x /usr/local/bin/app-db-migrations.sh


# Make an entry point script that has access to the env to run db migrations
ENV NODE_ENV="production"

RUN npm install -g pnpm
RUN pnpm install

RUN pnpm run db:packages:api

EXPOSE 9990

# Initialize HSM on startup
# ENTRYPOINT ["/usr/local/bin/app-db-migrations.sh"]

CMD ["pnpm", "start:packages:api"]
