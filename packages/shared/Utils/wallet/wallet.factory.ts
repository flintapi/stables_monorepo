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

import type {
  ChainId,
  CollectionAddressParams,
  CreateOrGetAccountConfig,
} from "./wallet.entities";

import HSMSigner from "../signers/hsm-signer";
import * as supportedChains from "./wallet.chains";
import { BUNDLER_URLS } from "./wallet.constants";
import { indexManager } from "./wallet.utils";

/**
 * WalletFactory - Implements the Factory Pattern for wallet creation and management
 *
 * This class provides static methods and instance methods for:
 * - Creating collection addresses
 * - Creating organization root/master wallets
 * - Deriving public keys from master wallets
 */
export class WalletFactory {
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
  ): Promise<Address> {
    const { treasuryKeyLabel, index, chain: chainId } = params;

    const chain = this.getChain(chainId);
    const hsmsigner = new HSMSigner(treasuryKeyLabel);

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const signer = hsmsigner.toViemAccount();

    const { account } = await this.getSmartAccount(signer, publicClient, {
      index,
    });

    return account.address; // Return a valid address
  }

  /**
   * Create or get smart accounts for collection
   * Smart accounts for collections
   */
  async createOrGet(
    config: CreateOrGetAccountConfig = {
      chainId: 97,
      keyLabel: process.env.TREASURY_KEY_LABEL!, // by default get the progentitor key
      index: 0n,
      isMaster: false,
    },
  ): Promise<{
    client: KernelAccountClient;
    account: CreateKernelAccountReturnType<"0.7">;
  }> {
    // TODO: create or get the master wallet for the keyLabel config and its configuration

    const { keyLabel, chainId } = config;
    let { index } = config;

    const chain = this.getChain(chainId);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const hsmSigner = new HSMSigner(keyLabel);

    const signer = hsmSigner.toViemAccount();

    const manager = indexManager();

    if (!index) {
      const storedIndex = await manager.get(keyLabel);
      index = BigInt(storedIndex);

      await manager.set(keyLabel, storedIndex + 1);
    }

    const { account, client } = await this.getSmartAccount(
      signer,
      publicClient,
      {
        index,
      },
    );
    return { account, client };
  }

  private getChain(id: ChainId): Chain {
    return extractChain({
      chains: Object.values(this.supportedChains),
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
