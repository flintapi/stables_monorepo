// BullMQ Adapter
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { QueueInstances } from "@flintapi/shared/Queue";
import { serveStatic } from "@hono/node-server/serve-static";

import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import tasks from "@/routes/tasks/tasks.index";

const app = createApp();

configureOpenAPI(app);

const serverAdapter = new HonoAdapter(serveStatic);
createBullBoard({
  queues: [
    new BullMQAdapter(QueueInstances["ramp-queue"]),
    new BullMQAdapter(QueueInstances["swap-queue"]),
  ],
  serverAdapter,
});

const bullMQBasePath = "/mq-board";
serverAdapter.setBasePath(bullMQBasePath);
app.route(bullMQBasePath, serverAdapter.registerPlugin());

const routes = [
  index,
] as const;
routes.forEach((route) => {
  app.route("/", route);
});

const protectedRoutes = [
  tasks,
] as const;

// Add auth hadnler
app.on(["POST", "GET", "OPTION", "DELETE", "PUT"], "/api/auth/*", async c => await auth.handler(c.req.raw));

protectedRoutes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number] & typeof protectedRoutes[number];

export default app;
