import { ListenerConfig } from "./lib/types";

// Factory for creating configured listeners
export default class {
  static createERC20TransferListener(
    tokenAddress: string,
    fromAddress?: string,
    persistent = false
  ): Omit<ListenerConfig, 'id'> {
    return {
      eventName: 'Transfer',
      filter: {
        address: tokenAddress,
        topics: fromAddress ? [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          fromAddress
        ] : undefined
      },
      persistent,
      onEvent: async (event) => {
        console.log('Transfer event received:', event);
        // Custom indexing logic here
      }
    };
  }
}
