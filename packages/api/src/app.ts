// BullMQ Adapter
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { serveStatic } from "@hono/node-server/serve-static";

import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import ramp from "@/routes/ramp/ramp.index";
import wallet from "@/routes/wallet/wallet.index";
import webhook from "@/routes/webhooks/webhooks.index";

const app = createApp();

configureOpenAPI(app);

const serverAdapter = new HonoAdapter(serveStatic);
createBullBoard({
  queues: [
    new BullMQAdapter(QueueInstances["ramp-queue"]),
    new BullMQAdapter(QueueInstances["swap-queue"]),
    new BullMQAdapter(QueueInstances["event-queue"]),
    new BullMQAdapter(QueueInstances[QueueNames.WALLET_QUEUE]),
  ],
  serverAdapter,
});

const bullMQBasePath = "/mq-board";
serverAdapter.setBasePath(bullMQBasePath);
app.route(bullMQBasePath, serverAdapter.registerPlugin());

const routes = [index, webhook] as const;
routes.forEach((route) => {
  app.route("/", route);
});

const protectedRoutes = [ramp, wallet] as const;

// Add auth hadnler
app.on(
  ["POST", "GET", "OPTION", "DELETE", "PUT"],
  "/api/auth/*",
  async (c) => await auth.handler(c.req.raw),
);

protectedRoutes.forEach((route) => {
  app.route("/v1/", route);
});

export type AppType = (typeof routes)[number] &
  (typeof protectedRoutes)[number];

export default app;
