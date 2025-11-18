#!/bin/bash
set -euo pipefail

echo "Initializing SoftHSM..."

# ls /var/lib/softhsm -A

if [ ! -e "/var/lib/softhsm/softhsm2.conf" ]; then
  echo "Writing to softhsm configuration file"

  echo "directories.tokendir = /var/lib/softhsm/tokens" >> /var/lib/softhsm/softhsm2.conf
  echo "objectstore.backend = file" >> /var/lib/softhsm/softhsm2.conf
  echo "log.level = INFO" >> /var/lib/softhsm/softhsm2.conf
  echo "slots.removable = false" >> /var/lib/softhsm/softhsm2.conf
  echo "slots.mechanisms = ALL" >> /var/lib/softhsm/softhsm2.conf
  echo "slots.max = 10" >> /var/lib/softhsm/softhsm2.conf
fi

mkdir -p /var/lib/softhsm/tokens

# # SoftHSM v2 configuration file
# directories.tokendir = /var/lib/softhsm/tokens
# objectstore.backend = file

# # Logging level (DEBUG, INFO, WARNING, ERROR)
# log.level = INFO

# # If CKF_REMOVABLE_DEVICE flag should be set
# slots.removable = false

# # Enable and disable algorithms
# slots.mechanisms = ALL

# # Set the maximum number of slots
# slots.max = 10

ls -al /usr/lib/softhsm/
softhsm2-util --show-slots

# Check if token already exists
if softhsm2-util --show-slots | grep "hsm-token"; then
    echo "Token already initialized, skipping initialization"
else
    echo "Creating new token..."

    # Get SO PIN and User PIN from environment or use defaults
    SO_PIN="${SOFTHSM_SO_PIN:-1234}"
    USER_PIN="${SOFTHSM_USER_PIN:-5678}"

    # Initialize token
    softhsm2-util --init-token --slot 0 --label "hsm-token" \
        --so-pin "$SO_PIN" --pin "$USER_PIN"

    echo "Token initialized successfully"
fi

# Show available slots
echo "Available slots:"
softhsm2-util --show-slots

# Execute the command passed to the container
exec "$@"
