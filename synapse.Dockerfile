FROM node:20-alpine AS builder

WORKDIR /app

COPY pnpm-lock.yaml package*.json ./

RUN npm install -g pnpm

COPY ./packages/shared ./
COPY ./services/synapse ./
COPY ./pnpm-workspace.yaml ./
COPY ./turbo.json ./

RUN pnpm install

RUN pnpm run build:services:synapse

# Production build :runner

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json

# Copy over service folder and files
COPY --from=builder /app/services/synapse/dist ./services/synapse/dist
COPY --from=builder /app/services/synapse/src/db/migrations ./services/synapse/dist/src/db/migrations
COPY --from=builder /app/services/synapse/package.json ./services/synapse/package.json

# Make an entry point script that has access to the env to run db migrations
ENV NODE_ENV="development"

RUN npm install -g pnpm
RUN pnpm install

EXPOSE 9990

CMD ["pnpm", "start:services:synapse"]
