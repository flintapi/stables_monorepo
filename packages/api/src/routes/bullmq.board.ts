// BullMQ Adapter
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { serveStatic } from "@hono/node-server/serve-static";
import { authorizeBullBoard } from "@/middlewares/authorize-bull-board";
import env from "@/env";

import { Hono } from "hono";


const serverAdapter = new HonoAdapter(serveStatic);
createBullBoard({
  queues: [
    new BullMQAdapter(QueueInstances["ramp-queue"]),
    new BullMQAdapter(QueueInstances["swap-queue"]),
    new BullMQAdapter(QueueInstances["event-queue"]),
    new BullMQAdapter(QueueInstances[QueueNames.WALLET_QUEUE]),
  ],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: "Flint MQ Board",
      boardLogo: {
        path: `https://flintapi.io/icon.png`,
        width: 30,
        height: 30
      },
      favIcon: {
        default: 'https://flintapi.io/icon.png',
        alternative: 'https://flintapi.io/icon.png'
      }
    }
  }
});

const bullMQBasePath = "/mq-board";
serverAdapter.setBasePath(bullMQBasePath);

const app = new Hono();

app.use(authorizeBullBoard())

app.route(bullMQBasePath, serverAdapter.registerPlugin());

export default app;
