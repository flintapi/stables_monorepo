import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import index from "@/routes/index.route";
import users from "@/routes/users/users.index";

import { validateRequest } from "./middlewares/validate-request";

const app = createApp();

configureOpenAPI(app);

const routes = [
  index,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

const guardedRoutes = [
  users,
] as const;

app.use(async (c, next) => validateRequest(c, next));
guardedRoutes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
