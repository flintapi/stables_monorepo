import {createAuthClient} from "better-auth/react"
import { emailOTPClient, multiSessionClient, twoFactorClient } from "better-auth/client/plugins"
import { env } from "@/env";


export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [
    multiSessionClient(),
    twoFactorClient(),
    emailOTPClient()
  ]
});
