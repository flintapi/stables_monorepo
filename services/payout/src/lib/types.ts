import { selectUserSchema } from "@/db/schema/auth-schema";
import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { WorkflowBindings } from "@upstash/workflow/hono";
import type { Schema } from "hono";
import type { PinoLogger } from "hono-pino";
import z from "zod"

export type Merchant = z.infer<typeof selectUserSchema>;

export interface AppBindings extends WorkflowBindings {
  Variables: {
    logger: PinoLogger;
    merchantName: string;
    merchant: Merchant;
  };
};

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;

// Centiiv
export interface CentiivDisbursementInput {
  trackingId: string;
  amount: number;
  currency: `NGN`;
  recipientAccountNumber: string;
  recipientBankCode: string;
  description: string;
}

