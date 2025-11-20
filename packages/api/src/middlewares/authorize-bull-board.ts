import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie"
import { AppBindings } from "@/lib/types";
// import md5 from "md5"
import env from "@/env";
import { timingSafeEqual } from "crypto";
import { CacheFacade } from "@flintapi/shared/Cache";
// 
// Configuration
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const SESSION_COOKIE_NAME = 'mq_auth_session';

// Helper: Generate random session ID
function generateSessionId(): string {
  return crypto.randomUUID();
}

function getKey(sessionId: string) {
  return `mq_session:${sessionId}`;
}


export const authorizeBullBoard = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    const sessionId = getCookie(c, SESSION_COOKIE_NAME)
    console.log("Cookie", sessionId)

    if (sessionId) {
      const sessionData = await CacheFacade.redisCache.get(getKey(sessionId));

      if (sessionData) {
        const session = JSON.parse(sessionData);
        // TODO: Do something with session data

        await CacheFacade.redisCache.expire(getKey(sessionId), SESSION_TIMEOUT / 1000);
        await next();
        return;
      }
    }

    const auth = c.req.header("Authorization")

    console.log("Authentication Basic", auth)

    if (!auth || !auth.startsWith('Basic ')) {
      // Send 401 with WWW-Authenticate header to trigger browser prompt
      c.header('WWW-Authenticate', 'Basic realm="Protected Area"');
      return c.text('Unauthorized', 401);
    }

    // Decode base64 credentials
    try {
      const base64Credentials = auth.slice(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      const validUsername = env.MQ_ADMIN_USERNAME;
      const validPassword = env.MQ_ADMIN_PASSWORD;

      // Timing-safe comparison to prevent timing attacks
      const usernameMatch = timingSafeEqual(
        Buffer.from(username),
        Buffer.from(validUsername)
      );
      const passwordMatch = timingSafeEqual(
        Buffer.from(password),
        Buffer.from(validPassword)
      );

      if (usernameMatch && passwordMatch) {
        const newSessionId = generateSessionId();

        await CacheFacade.redisCache.setex(
          getKey(newSessionId),
          SESSION_TIMEOUT / 1000,
          JSON.stringify({ username })
        );

        setCookie(c, SESSION_COOKIE_NAME, newSessionId, {
          httpOnly: true,
          secure: env.NODE_ENV !== 'development',
          sameSite: 'Strict',
          maxAge: SESSION_TIMEOUT / 1000
        });

        await next();
      } else {
        c.header('WWW-Authenticate', 'Basic realm="Secure Zone"');
        return c.text('Unauthorized', 401);
      }
    } catch (error) {
      c.header('WWW-Authenticate', 'Basic realm="Secure Zone"');
      return c.text('Unauthorized', 401);
    }
  });


// class Hasher {
//   static verify(password: string, hash: string): boolean {
//     const reHash = md5(password)
//     return reHash === hash;
//   }

//   static hash(password: string): string {
//     return md5(password)
//   }
// }
