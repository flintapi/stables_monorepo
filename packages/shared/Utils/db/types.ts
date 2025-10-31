export interface OrgMetadata {
  dbUrl: string;
}

export interface WalletMetadata {
  linkedVirtualAccounts: Array<Record<string, any>>;
  [key: string]: any;
}

export type WalletAddresses = Array<{
  type: "smart" | "eoa" | string;
  address: string;
  network: "evm" | "btc" | "sol";
  chain?: `eip155:${string}` | string;
  [key: string]: any;
}>;

export interface TransactionMetadata {
  isDestinationExternal: boolean;
  address?: string;
  walletId?: string;
  bankCode?: string;
  accountNumber?: string;
  index?: number;
  [key: string]: any;
}

export interface APIKeyMetadata {
  organizationId: string;
  webhookSecret: string;
  webhookUrl: string;
}
