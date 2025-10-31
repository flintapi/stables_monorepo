import env from "@/env";
import { SupportedChains } from "@flintapi/shared/Utils";

export const RPC_URLS = {
  [SupportedChains.base]: env.BASE_RPC,
  [SupportedChains.baseSepolia]: env.BASE_SEPOLIA_RPC,
  [SupportedChains.bsc]: env.BSC_RPC,
  [SupportedChains.bscTestnet]: env.BSC_TESTNET_RPC,
};
