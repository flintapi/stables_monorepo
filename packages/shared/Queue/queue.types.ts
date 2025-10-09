import { Address } from "viem";

export type RampServiceJob = {
    data: any
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
}
