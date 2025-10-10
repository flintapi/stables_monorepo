import { Address } from "viem";

export type RampServiceJob = {
    type: "off" | "on";
    organizationData: any;
    transactionData: any;
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
    organizationData: any;
    transactionData: any;
  }
}
