import {createAuthClient} from "better-auth/react"
import { apiKeyClient, emailOTPClient, multiSessionClient, organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { env } from "@/env";


export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  basePath: "/api/auth",
  plugins: [
    multiSessionClient(),
    twoFactorClient(),
    emailOTPClient(),
    organizationClient(),
    apiKeyClient()
  ]
});
