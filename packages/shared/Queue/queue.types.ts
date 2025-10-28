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
  callbackUrl: string;
  rampData?: {
    type: "off" | "on";
    organizationId: string;
    transactionId: string;
  };
}

/**
 * Get or create a wallet for a user or off/on ramp operation
 */
export type WalletGetOrCreateJob =
  | {
      type: "smart"; // for off/on ramp
      chainId: ChainId;
      keyLabel: string;
      index?: number;
    }
  | {
      type: "eoa";
      chainId: ChainId;
      keyLabel: string;
    };

/**
 * Sign and send transactions from wallet operations or default off/on ramp operations
 */
export interface WalletSignTransactionJob {
  chainId: ChainId;
  data: Hex;
  contractAddress: Address;
  keyLabel: string;
  index?: number;
}

export interface MiscJob {
  data: any;
}
