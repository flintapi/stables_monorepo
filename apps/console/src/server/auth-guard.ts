import { createServerFn } from "@tanstack/react-start"

import { getWebRequest } from '@tanstack/react-start/server'
import {redirect} from "@tanstack/react-router"

import {z} from "zod"
import { authClient } from '@/lib/auth-client'

export const authGuard = createServerFn()
  .validator(z.object({
    redirect: z.string().min(1).optional(),
  }).optional())
  .handler(async ({data}) => {
    const request = getWebRequest()
    const { data: session } = await authClient.getSession({
      fetchOptions: { headers: request.headers },
    })

    if (!session) {
      throw redirect({
        to: '/auth',
        search: {
          redirect: data && data.redirect
        }
      })
    }
    // else throw redirect({ to: '/overview' })

})
