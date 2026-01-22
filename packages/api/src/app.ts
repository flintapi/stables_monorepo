
import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import ramp from "@/routes/ramp/ramp.index";
import wallet from "@/routes/wallet/wallet.index";
import specops from "@/routes/spec-ops/spec-ops.index";
import webhook from "@/routes/webhooks/webhooks.index";
import console from "@/routes/console/console.index";
import bullMqBoard from "@/routes/bullmq.board";

const app = createApp();

configureOpenAPI(app);

const routes = [index, webhook] as const;
routes.forEach((route) => {
  app.route("/", route);
});

const protectedRoutes = [ramp, wallet, specops, console] as const;

// Add auth hadnler
app.on(
  ["POST", "GET", "OPTION", "DELETE", "PUT"],
  "/api/auth/*",
  async (c) => await auth.handler(c.req.raw),
);

protectedRoutes.forEach((route) => {
  app.route("/v1/", route);
});

app.route("/", bullMqBoard);

export type AppType = (typeof routes)[number] &
  (typeof protectedRoutes)[number];

export default app;
