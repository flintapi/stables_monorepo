import { queryOptions } from "@tanstack/react-query";
import { authClient } from "./auth-client";

export const getTeamQueryOptions = queryOptions({
  queryKey: ["team", "list"],
  queryFn: async () => {
    const { data: team, error} = await authClient.organization.listMembers();

    if (error) throw error;
    return team
  }
})


export const getOrganizationsQueryOptions = queryOptions({
  queryKey: ['organization', "list"],
  queryFn: async () => {
    const { data, error } = await authClient.organization.list();

    if (error) throw error;

    return data
  }
})

// TOOD: Get organization API Keys query
