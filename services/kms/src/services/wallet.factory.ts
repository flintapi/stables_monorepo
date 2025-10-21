import type {
  CreateKernelAccountReturnType,
  KernelAccountClient,
  SmartAccountClientConfig,
} from "@zerodev/sdk";
import type { Address, Chain, LocalAccount, PublicClient } from "viem";

import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { createPublicClient, extractChain, http } from "viem";

import type { ChainId, SupportedChains } from "@flintapi/shared/Utils";

import HSMSigner from "../signers/hsm-signer";
import { supportedChains } from "@flintapi/shared/Utils";
import { BUNDLER_URLS } from "./wallet.constants";
import { indexManager } from "@flintapi/shared/Utils";

// Types and interfaces
export interface CollectionAddressParams {
  treasuryKeyLabel: string;
  chainId: ChainId;
  index?: bigint;
}

export interface CollectionAddressReturnType {
  address: Address;
  index: bigint;
}

export interface CreateOrGetAccountConfig {
  chainId: ChainId;
  keyLabel: string;
}

/**
 * WalletFactory - Implements the Factory Pattern for wallet creation and management
 *
 * This class provides static methods and instance methods for:
 * - Creating collection addresses
 * - Creating organization root/master wallets
 * - Deriving public keys from master wallets
 */
class WalletFactory {
  private static instance: WalletFactory;
  private supportedChains = supportedChains;
  // private organizationWallets: Map<string, OrganizationWallet> = new Map();

  private smartAAConfig = {
    kernelVersion: KERNEL_V3_1,
    entryPoint: getEntryPoint("0.7"),
  };

  constructor() {}

  /**
   * Singleton pattern implementation
   */
  static getInstance(): WalletFactory {
    if (!WalletFactory.instance) {
      WalletFactory.instance = new WalletFactory();
    }
    return WalletFactory.instance;
  }

  /**
   * Static method to create collection addresses based on parameters
   * This generates deterministic addresses for collections on and off ramp transactions
   */
  async createCollectionAddress(
    params: CollectionAddressParams,
  ): Promise<CollectionAddressReturnType> {
    const { treasuryKeyLabel, chainId } = params;
    let index = params.index;

    const chain = this.getChain(chainId);
    const hsmsigner = new HSMSigner(treasuryKeyLabel);

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const signer = hsmsigner.toViemAccount();

    const manager = indexManager();

    if (!index) {
      const storedIndex = await manager.get(treasuryKeyLabel);
      index = BigInt(storedIndex);

      await manager.set(treasuryKeyLabel, storedIndex + 1);
    }

    const { account } = await this.getSmartAccount(signer, publicClient, {
      index,
    });

    return { address: account.address, index }; // Return a valid address
  }

  /**
   * Create or get smart accounts for collection
   * Smart accounts for collections
   */
  async createOrGet(
    config: CreateOrGetAccountConfig = {
      chainId: 97,
      keyLabel: process.env.TREASURY_KEY_LABEL!, // by default get the progentitor key
    },
  ): Promise<{
    client: KernelAccountClient;
    account: CreateKernelAccountReturnType<"0.7">;
  }> {
    // TODO: create or get the master wallet for the keyLabel config and its configuration

    const { keyLabel, chainId } = config;

    const chain = this.getChain(chainId);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const hsmSigner = new HSMSigner(keyLabel);

    const signer = hsmSigner.toViemAccount();

    const { account, client } = await this.getSmartAccount(
      signer,
      publicClient,
    );
    return { account, client };
  }

  private getChain(id: ChainId): Chain {
    return extractChain({
      chains: Object.values(supportedChains),
      id,
    });
  }

  private async getSmartAccount(
    signer: LocalAccount,
    publicClient: PublicClient,
    kernelAccountConfig?: { index: bigint; [key: string]: any },
    kernelClientConfig?: {
      paymaster?: SmartAccountClientConfig["paymaster"];
      chain?: SmartAccountClientConfig["chain"];
    },
  ) {
    // Return smart account object
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer,
      ...this.smartAAConfig,
    });

    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
      },
      ...this.smartAAConfig,
      ...(kernelAccountConfig && kernelAccountConfig),
    });

    const bundlerUrls = BUNDLER_URLS.get(publicClient.chain?.id as any);

    if (!bundlerUrls) {
      throw new Error("Bundler URL's are not provided for this chain, confirm");
    }

    const client = createKernelAccountClient({
      account,
      chain: publicClient.chain,
      bundlerTransport: http(bundlerUrls[0]), // Pick first one by default
      ...kernelClientConfig,
    });

    return { client, account };
  }
}

// Export default factory instance
export default WalletFactory.getInstance();
