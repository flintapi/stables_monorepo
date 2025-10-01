
export interface OrgMetadata {
  dbUrl: string;
  clientId: string;
  webhookSecret: string;
  webhookUrl: string;
}

export interface WalletMetadata {
  [key: string]: any
}

export interface TransactionMetadata {
  isAccountExternal: boolean;
  accountAddress: string;
}
