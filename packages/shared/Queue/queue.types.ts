import type { Address, Hex } from "viem";

import type { PaymentProvider } from "Adapters";
import type { ChainId } from "Utils";

export interface RampServiceJob {
  type: "off" | "on";
  organizationId: string;
  transactionId: string;
  prevProviders?: PaymentProvider[];
}

export interface SwapServiceJob {
  data: any;
}

export interface EventServiceJob {
  chainId: number;
  eventName: "Transfer" | "Approval" | string;
  eventArgType: "from" | "to";
  address: Address;
  tokenAddress: Address;
  persist: boolean;
  rampData?: {
    type: "off" | "on";
    organizationId: string;
    transactionId: string;
  };
}

export type WalletServiceJob = ({
  name: "get-address";
  chainId: ChainId;
  keyLabel?: string;
  index?: bigint;
} | {
  name: "sign-transaction";
  chainId: ChainId;
  data: Hex;
  contractAddress: Address;
  keyLabel?: string;
  index?: bigint;
});

export interface MiscJob {
  data: any;
}
