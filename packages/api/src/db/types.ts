
export interface OrgMetadata {
  dbUrl: string;
  clientId: string;
  webhookSecret: string;
  webhookUrl: string;
}

export interface WalletMetadata {
  linkedVirtualAccounts: Array<Record<string, any>>;
  [key: string]: any
}

export type WalletAddresses = Array<{
  type: "smart" | "eoa" | string
  address: string;
  chain: `eip155:${string}` | string;
  [key: string]: any;
}>;

export interface TransactionMetadata {
  isDestinationExternal: boolean;
  address?: string;
  walletId?: string;
  bankCode?: string;
  accountNumber?: string;
  [key: string]: any
}
