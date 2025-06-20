import configureOpenAPI from "@/lib-core/configure-open-api";
import createApp from "@/lib-core/create-app";
import index from "@/routes/index.route";
// import tasks from "@/routes/tasks/tasks.index";

const app = createApp();

configureOpenAPI(app);

const routes = [index] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = (typeof routes)[number];

export default app;
