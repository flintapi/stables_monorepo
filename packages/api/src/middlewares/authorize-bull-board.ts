import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { getCookie } from "hono/cookie"
import { sign, verify } from "hono/jwt"

import { auth, defaultPermissions } from "@/lib/auth";
import db, { orgDb } from "@/db";
import { APIKeyMetadata, OrgMetadata } from "@flintapi/shared/Utils";
import { AppBindings, Organization } from "@/lib/types";
import { APIError } from "better-auth";
import md5 from "md5"
import env from "@/env";

export const authorizeBullBoard = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    const mqCookie = getCookie(c, 'mq_token')
    const body = await c.req.parseBody()

    const isBodyPresent = Object.entries(body).length > 0;
    console.log("Cookie, and body", mqCookie, isBodyPresent)

    if(mqCookie) {
      const jwtToken = await verify(mqCookie, env.JWT_SECRET, 'HS256');
      if(jwtToken) {
        // Continue
        await next()
      }
    } else if(!mqCookie && isBodyPresent) {
      const email = body["email"] as string;
      const password = body["password"] as string;

      if(email !== env.BOARD_EMAIL) {
        return c.json({message: "Invalid email"}, HttpStatusCodes.BAD_REQUEST);
      }
      if(!Hasher.verify(password, env.BOARD_PHASH)) {
        return c.json({
          message: "Invalid password used"
          },
          HttpStatusCodes.BAD_REQUEST
        )
      }
    } else {
      console.log("No cookie or body")
      return c.json({
        message: "No input present..."
      }, HttpStatusCodes.BAD_REQUEST);
    }
  });


class Hasher {
  static verify(password: string, hash: string): boolean {
    const reHash = md5(password)
    return reHash === hash;
  }

  static hash(password: string): string {
    return md5(password)
  }
}

function main() {
  const hash = Hasher.hash('bullmqBYTE20000!')
  console.log("Password hash", hash)
}
