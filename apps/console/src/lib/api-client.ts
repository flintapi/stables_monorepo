import { queryOptions } from '@tanstack/react-query'
import { authClient } from './auth-client'
import type { z } from 'zod'
import type { orgSchema } from '@flintapi/shared/Utils'

export const getTeamQueryOptions = queryOptions({
  queryKey: ['team', 'list'],
  queryFn: async () => {
    const { data: team, error } = await authClient.organization.listMembers()

    if (error) throw error
    return team
  },
})

export const getInvitationQueryOptions = queryOptions({
  queryKey: ['invitation', 'list'],
  queryFn: async () => {
    const { data: invitations, error } =
      await authClient.organization.listInvitations()

    if (error) throw error
    return invitations
  },
})

export const getOrganizationsQueryOptions = queryOptions({
  queryKey: ['organization', 'list'],
  queryFn: async () => {
    const { data, error } = await authClient.organization.list()

    if (error) throw error

    return data
  },
})

// TOOD: Get organization API Keys query
export const getOrganizationApiKeysQueryOptions = (organizationId: string) =>
  queryOptions({
    queryKey: ['organization', 'api-keys'],
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list()

      if (error) throw error

      return data.filter(
        (key) => key.metadata?.organizationId === organizationId,
      )
    },
  })

// @ts-ignore Use selectTransactionSchema to infer type
type OrganizationTransaction = z.infer<typeof orgSchema.selectTransactionSchema>
export const getOrganizationTransactionsQueryOptions = queryOptions({
  queryKey: ['organization', 'transactions'],
  queryFn: async () => {
    const { data, error } = await authClient.$fetch<
      Array<OrganizationTransaction>
    >('/v1/console/transactions', {
      method: 'GET',
    })

    if (error) throw error

    return data
  },
})
