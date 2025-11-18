FROM node:20-alpine AS builder

# Build kms-service worker
WORKDIR /app

COPY ../../pnpm-lock.yaml ../../package*.json ./
COPY ../../pnpm-workspace.yaml ./

RUN npm install -g pnpm

COPY ../../packages/shared ./packages/shared
COPY ../../services/kms ./services/kms
COPY ../../turbo.json ./

ENV NODE_ENV="development"

RUN pnpm install

RUN pnpm run build:services:kms

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
# COPY --from=builder /app/node_modules ./node_modules

# Copy over service folder and files
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/kms/dist ./services/kms/dist
# COPY --from=builder /app/services/ramp/src/db/migrations ./services/ramp/dist/src/db/migrations
COPY --from=builder /app/services/kms/package.json ./services/kms/package.json


# Install SoftHSM2 and dependencies
# Install SoftHSM2 and build dependencies for native modules
RUN apk add --no-cache \
  softhsm \
  opensc \
  p11-kit \
  python3 \
  build-base \
  libc6-compat \
  gcompat \
  make \
  g++ \
  gcc \
  openssl-dev \
  bash \
  curl \
  && rm -rf /var/cache/apk/*

# Verify installations
RUN node -v && \
  npm -v && \
  softhsm2-util --version && \
  python3 --version && \
  gcc --version


# Add NodeSource repository and install Node.js (including npm)
# RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash -
# RUN apt-get update && apt-get install -y nodejs

# Verify installation
# RUN node -v
# RUN npm -v

# Install pnpm using the official script
# RUN curl -fsSL https://get.pnpm.io/install.sh | sh -
# Set Python for node-gyp
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3

# Create softhsm user and group with home directory
# Alpine uses addgroup/adduser instead of groupadd/useradd
RUN addgroup -S softhsm1 && \
  adduser -S -G softhsm1 -h /home/softhsm1 -s /bin/bash softhsm1

# Create necessary directories with proper permissions
# Note: Alpine's default SoftHSM token directory
RUN mkdir -p /var/lib/softhsm/tokens && \
  chown -R softhsm1:softhsm1 /var/lib/softhsm && \
  chmod -R u+rwX /var/lib/softhsm/tokens

# RUN ls -ld /var/lib/softhsm/tokens

# Copy configuration
COPY ../../services/kms/softhsm2.conf /var/lib/softhsm/

# Copy initialization script
COPY ../../services/kms/init-hsm.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-hsm.sh

# Set ownership of application files to softhsm1 user
RUN chown -R softhsm1:softhsm1 /app

# Create and set ownership of pnpm directories
RUN mkdir -p /home/softhsm1/.local/share/pnpm && \
  chown -R softhsm1:softhsm1 /home/softhsm1

# Switch to softhsm user
USER softhsm1

# Set environment variables
ENV SOFTHSM2_CONF=/var/lib/softhsm/softhsm2.conf
ENV PKCS11_MODULE_PATH=/usr/lib/softhsm/libsofthsm2.so
ENV PNPM_HOME=/home/softhsm1/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV="development"

RUN npm install -g pnpm
RUN pnpm install

RUN pnpm rebuild pkcs11js --verbose
RUN pnpm rebuild graphene-pk11 --verbose

ENV NODE_ENV="production"
# Initialize HSM on startup
ENTRYPOINT ["/usr/local/bin/init-hsm.sh"]

# Keep container running and provide access to PKCS#11 library
# CMD ["tail", "-f", "/dev/null"]
CMD ["pnpm", "start:services:kms"]
