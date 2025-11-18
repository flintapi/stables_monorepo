import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

import packageJSON from "../../package.json" with { type: "json" };

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "Stablestack API",
      description: "The stablecoin development stack you need! 🚀"
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      theme: "kepler",
      layout: "classic",
      title: "Stablestack API Reference",
      pageTitle: "Stablestack API Reference",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
}
