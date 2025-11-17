FROM debian:bookworm-slim

# Install SoftHSM2 and dependencies
RUN apt-get update && apt-get install -y \
  softhsm2 \
  opensc \
  p11-kit \
  curl \
  gnupg \
  && rm -rf /var/lib/apt/lists/*

# Add NodeSource repository and install Node.js (including npm)
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Verify installation
RUN node -v
RUN npm -v

# Install pnpm globally as root
RUN npm install -g pnpm

# Build kms-service worker
WORKDIR /app
COPY ../../pnpm-lock.yaml ../../package*.json ./
COPY ../../pnpm-workspace.yaml ./
COPY ../../packages/shared ./packages/shared
COPY ../../services/kms ./services/kms
COPY ../../turbo.json ./

ENV NODE_ENV="production"
RUN pnpm install
RUN pnpm run build:services:kms

# Create softhsm user and group with home directory
RUN groupadd -r softhsm1 && useradd -r -g softhsm1 -m -d /home/softhsm1 softhsm1

# Create necessary directories
RUN mkdir -p /var/lib/softhsm/tokens && \
  chown -R softhsm1:softhsm1 /var/lib/softhsm && \
  chmod -R u+rwX /var/lib/softhsm/tokens

RUN ls -ld /var/lib/softhsm/tokens

# Copy configuration
COPY ../../services/kms/softhsm2.conf /var/lib/softhsm/

# Copy initialization script
COPY ../../services/kms/init-hsm.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-hsm.sh

# Set ownership of application files to softhsm1 user
RUN chown -R softhsm1:softhsm1 /app

# Switch to softhsm user
USER softhsm1

# Set environment variables
ENV SOFTHSM2_CONF=/var/lib/softhsm/softhsm2.conf
ENV PKCS11_MODULE_PATH=/usr/lib/softhsm/libsofthsm2.so

# Initialize HSM on startup
ENTRYPOINT ["/usr/local/bin/init-hsm.sh"]

# Keep container running and provide access to PKCS#11 library
# CMD ["tail", "-f", "/dev/null"]
CMD ["pnpm", "start:services:kms"]
