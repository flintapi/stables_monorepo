import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import payouts from "@/routes/payouts/payouts.index";
import users from "@/routes/users/users.index";
import webhooks from "@/routes/webhooks/webhooks.index";
import workflows from "@/routes/workflows/workflows.index";

import { validateRequest } from "./middlewares/validate-request";

const app = createApp();

configureOpenAPI(app);

const routes = [
  index,
  users,
  workflows,
  webhooks,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

const guardedRoutes = [
  payouts,
] as const;

app.use((c, next) => validateRequest(c, next));
guardedRoutes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
