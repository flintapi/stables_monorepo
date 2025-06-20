import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib-core/types";

import type { Finalize, GetQuote } from "./routes";

export const getQuote: AppRouteHandler<GetQuote> = async (c) => {
  const param = c.req.valid("param");

  console.warn(param, "Body of request");
  return c.json(
    {
      quote: 1620, // quote for pair
      quoteId: "quote-id",
    },
    HttpStatusCodes.OK,
  );
};

export const finalize: AppRouteHandler<Finalize> = async (c) => {
  const body = c.req.valid("json");

  console.warn(body, "Body of request");
  return c.json(
    {
      reference: "reference-id",
      quoteId: "quote-id",
      status: "success",
      receivable: 1620,
      fee: 10,
    },
    HttpStatusCodes.OK,
  );
};
