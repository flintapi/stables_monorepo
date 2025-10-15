import { PaymentProvider } from "Adapters";
import { ChainId } from "Utils";
import { Address } from "viem";

export type RampServiceJob = {
    type: "off" | "on";
    organizationId: string;
    transactionId: string;
    prevProviders?: PaymentProvider[];
};

export type SwapServiceJob = {
    data: any
};

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
  }
}

export type WalletServiceJob = ({
  name: "get-address";
  chainId: ChainId;
  keyLabel: string;
  index?: bigint;
} | {
  name: "sign-transaction";
  chainId: ChainId;
  keyLabel: string;
  index?: bigint;
})

export interface MiscJob {
  data: any
}
