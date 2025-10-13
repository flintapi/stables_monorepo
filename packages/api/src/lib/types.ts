import { appSchema } from "@/db/schema";
import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Schema } from "hono";
import type { PinoLogger } from "hono-pino";
import {z} from "zod"

export type Organization = z.infer<typeof appSchema.selectOrganization>;

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    organization: Organization;
  };
};

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;


/**
 * Permissions for accessing resources.
*/
export type Permissions = {
  [resourceType: string]: string[] // TODO: experiment to find out if this can be changed to boolean for access to resource
}
