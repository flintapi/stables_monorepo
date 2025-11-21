import env from "@/env";
import { SupportedChains } from "@flintapi/shared/Utils";

export const RPC_URLS = {
  [SupportedChains.base]: env.BASE_RPC_TYPE === "websocket"? env.BASE_RPC : env.BASE_RPC_HTTP,
  [SupportedChains.baseSepolia]: env.BASE_SEPOLIA_RPC,
  [SupportedChains.bsc]: env.BSC_RPC_TYPE === "websocket"? env.BSC_RPC : env.BSC_RPC_HTTP,
  [SupportedChains.bscTestnet]: env.BSC_TESTNET_RPC,
};
