import { PaymentProvider } from "Adapters";
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

export interface MiscJob {
  data: any
}
