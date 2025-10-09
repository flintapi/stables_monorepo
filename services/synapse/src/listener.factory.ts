import { Address } from "viem";
import { ListenerConfig } from "./lib/types";

// Factory for creating configured listeners
export default class {
  static createERC20TransferListener(
    tokenAddress: Address,
    args: { from?: Address | Array<Address>; to?: Address | Array<Address>; },
    persistent = false,
    chainId: number,
    onEvent: (event: any) => Promise<void>
  ): Omit<ListenerConfig, 'id'> {
    return {
      chainId,
      filter: {
        address: tokenAddress,
        eventName: 'Transfer',
        args
      },
      persistent,
      onEvent,
    };
  }
}
