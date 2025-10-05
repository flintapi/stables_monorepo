import { Address } from "viem";

export type RampServiceJob = {
    data: any
};

export type SwapServiceJob = {
    data: any
};


type EventData = {
  chainId: number;
  eventName: "Transfer" | "Approval" | string;
  eventArgType: "from" | "to";
  address: Address;
  tokenAddress: Address;
  persist: boolean;
  callbackFn?: Function;
}
export interface EventServiceJob {
    data: EventData
}
