import { createServerFn } from '@tanstack/react-start'

import { getRequest } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'

import { z } from 'zod'
import { authClient } from '@/lib/auth-client'
import { env } from '@/env'

export const authGuard = createServerFn()
  .inputValidator(
    z
      .object({
        redirect: z.string().min(1).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    console.log("Environemnt variable:", env)
    const { data: session } = await authClient.getSession({
      fetchOptions: { headers: request.headers },
    })

    if (!session) {
      throw redirect({
        to: '/auth',
        search: {
          redirect: data && data.redirect,
        },
      })
    }

    return session
    // else {
    //   if(request.headers.)
    //   throw redirect({ to: '/overview' })
    // }
  })
