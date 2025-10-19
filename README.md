This monorepo contains all the flintapi packages and apps

# Workspaces

- apps/\*
- packages/\*
- services/\*

## Packages

- @flintapi/shared - core shared packages
- @flintapi/api

## Apps

- swap
- website
- wallet - open-source wallets with inbuilt liquidity management
- faucet - open-source faucet for testing

# Dev Dependencies

- Bull MQ Job Queue and Worker functionality for interservice communication and event handling
- Redis DB

# Simple Architectural Choice

Utilise Bull MQ Flows inside micro-services to handle chained inter-dependent tasks such as Provider settlements,
validations, Callback/Webhook URL call invocations, Handle triggered blockchain events as Jobs.

- Each service is implemented around a worker consuming jobs from a queues specifically for that service, and publishing jobs
  to queues for other service.

- Carefully managed job processing configurations, queue management and concurrent/parallels.

This unlocks another layer of interservice communication
