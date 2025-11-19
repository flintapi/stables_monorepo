import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { authClient } from './auth-client'
import { env } from '@/env'

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
export type OrganizationTransaction = {
  id: string
  type: 'off-ramp' | 'on-ramp' | 'transfer' | 'deposit'
  status: 'pending' | 'completed' | 'failed'
  network: string
  reference: string
  trackingId?: string
  walletId?: string
  amount: string
  narration?: string
  metadata: Record<string, any>
  createdAt: any
  updatedAt: any
}
export const getOrganizationTransactionsQueryOptions = queryOptions({
  queryKey: ['organization', 'transactions'],
  queryFn: async () => {
    try {
      const response = await fetch(
        `${env.VITE_API_URL}/v1/console/transactions`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )
      if(response.ok) {
        const data = (await response.json()) as Array<OrganizationTransaction>
        return data
      }

      const failedResponse = await response.json() as {message: string};
      throw new Error(failedResponse.message)

    } catch (error: any) {
      throw error
    }
  },
})

// @ts-ignore Use selectTransactionSchema to infer type
export type OrganizationWallet = {
  id: string
  keyLabel: string
  primaryAddress: string
  addresses: Array<{
    address: string
    network: string
    chain: string
    type: string
  }>
  isActive: boolean
  autoSweep: boolean
  autoSwap: boolean
  hasVirtualAccount: boolean
  metadata: Record<string, any>
  createdAt: any
  updatedAt: any
}
export const getOrganizationWalletsQueryOptions = queryOptions({
  queryKey: ['organization', 'wallets'],
  queryFn: async () => {
    try {
      const response = await fetch(`${env.VITE_API_URL}/v1/console/wallets`, {
        method: 'GET',
        credentials: 'include',
      })
      if(response.ok) {
        const data = (await response.json()) as Array<OrganizationWallet>

        return data
      }

      const failedResponse = await response.json() as {message: string};
      throw new Error(failedResponse.message)
    } catch (error: any) {
      console.log('Error occured fetching wallets', error)
      throw error
    }
  },
})

export const deleteAPIKeyMutationOptions = mutationOptions({
  mutationKey: ['organization', 'delete'],
  mutationFn: async (input: { keyId: string }) => {
    try {
      const { data, error } = await authClient.apiKey.delete({
        keyId: input.keyId,
      })

      if (error) {
        console.log('Failed to delete API key', error)
        throw error
      }

      return data
    } catch (error: any) {
      console.log('Error deleting api key', error)
      throw error
    }
  },
})

export const saveWebhookUrlMutationOptions = mutationOptions({
  mutationKey: ['organization', 'webhookUrl'],
  mutationFn: async (input: { url: string; keyId: string }) => {
    try {
      const { data, error } = await authClient.apiKey.update({
        keyId: input.keyId,
        metadata: { webhookUrl: input.url },
      })

      if (error) {
        console.log('Failed to delete API key', error)
        throw error
      }

      return data
    } catch (error: any) {
      console.log('Error deleting api key', error)
      throw error
    }
  },
})
