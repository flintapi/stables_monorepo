FROM node:20-alpine AS builder

WORKDIR /app

COPY ../../pnpm-lock.yaml ../../package*.json ./
COPY ../../pnpm-workspace.yaml ./

RUN npm install -g pnpm

COPY ../../packages/shared ./packages/shared
COPY ../../services/ramp ./services/ramp
COPY ../../turbo.json ./

RUN pnpm install

RUN pnpm run build:services:ramp

# Production build :runner

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json

# Copy over service folder and files
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/ramp/dist ./services/ramp/dist
COPY --from=builder /app/services/ramp/src/db/migrations ./services/ramp/dist/src/db/migrations
COPY --from=builder /app/services/ramp/package.json ./services/ramp/package.json

# Make an entry point script that has access to the env to run db migrations
ENV NODE_ENV="production"

RUN npm install -g pnpm
RUN pnpm install

EXPOSE 9990

CMD ["pnpm", "start:services:ramp"]
