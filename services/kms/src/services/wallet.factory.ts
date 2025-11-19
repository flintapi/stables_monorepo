import type {
  CreateKernelAccountParameters,
  CreateKernelAccountReturnType,
  KernelAccountClient,
  SmartAccountClientConfig,
} from "@zerodev/sdk";
import type { Address, Chain, Hex, LocalAccount, PublicClient } from "viem";

import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  getUserOperationGasPrice,
} from "@zerodev/sdk";
import {
  getEntryPoint,
  KERNEL_V3_1,
  KERNEL_V3_3,
} from "@zerodev/sdk/constants";
import { createPublicClient, extractChain, http } from "viem";

import { ChainId, SupportedChains } from "@flintapi/shared/Utils";

import hsmSigner from "../signers/hsm-signer";
import { supportedChains } from "@flintapi/shared/Utils";
import {
  BUNDLER_URLS,
  getBundlerUrl,
  getPaymasterUrl,
} from "./wallet.constants";
import { indexManager } from "@flintapi/shared/Utils";
import { KERNEL_V3_VERSION_TYPE } from "@zerodev/sdk/types";
import { kmsLogger } from "@flintapi/shared/Logger";
import { GetPaymasterDataReturnType } from "viem/account-abstraction";

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
    kernelVersion: KERNEL_V3_3,
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

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const signer = hsmSigner.toViemAccount(treasuryKeyLabel);

    const manager = indexManager();

    if (typeof index === "undefined") {
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
   * Create or get eip-7702 smart accounts
   * tied to the EOA from HSM keypairs
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
    // TODO: create or get the EOA wallet for the keyLabel config and its configuration

    const { keyLabel, chainId } = config;

    const chain = this.getChain(chainId);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const signer = hsmSigner.toViemAccount(keyLabel);

    const { account, client } = await this.getSmartAccount(
      signer,
      publicClient,
      {
        eip7702Account: signer,
      },
    );

    return { account, client };
  }

  async sendTransaction(params: {
    keyLabel: string;
    chainId: ChainId;
    data: Hex;
    contractAddress: Address;
    index?: bigint;
  }) {
    const { keyLabel, chainId, data, contractAddress, index } = params;

    const chain = this.getChain(chainId);

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    const signer = hsmSigner.toViemAccount(keyLabel);

    console.log("Index", index, typeof index)

    const { client, account } = await this.getSmartAccount(
      signer,
      publicClient,
      typeof index !== "undefined"
        ? {
            index,
          }
        : { eip7702Account: signer },
    );

    console.log("Smart account address", account.address, "Owner address")

    if(typeof index !== "undefined") {
      const userOpHash = await client.sendUserOperation({
        callData: await client.account.encodeCalls([{
          to: contractAddress,
          value: BigInt(0),
          data,
        }]),
      })

      console.log("UserOp hash:", userOpHash)
       console.log("Waiting for UserOp to complete...")

       const receipt = await client.waitForUserOperationReceipt({
         hash: userOpHash,
         timeout: 1000 * 15,
       })

       console.log("User op receipt", receipt)

       return receipt.receipt
    }

    const hash = await client.sendTransaction({
      chain,
      to: contractAddress,
      value: 0n,
      data,
    }).catch((error) => {
      console.log("Failed to send transaction", error);
      throw error;
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return receipt;
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
    kernelAccountConfig?: Pick<
      CreateKernelAccountParameters<"0.7", typeof KERNEL_V3_3>,
      "eip7702Account" | "eip7702Auth" | "index" | "plugins"
    >,
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

    const paymasterClient = createZeroDevPaymasterClient({
      chain: publicClient.chain,
      transport: http(
        getPaymasterUrl(
          publicClient.chain!.id as ChainId,
          publicClient.chain!.id,
        ),
      ),
    });

    const client = createKernelAccountClient({
      account,
      client: publicClient,
      chain: publicClient.chain,
      ...(publicClient.chain?.testnet && {paymaster: {
        getPaymasterData: async (userOperation) =>{
          try {
            return await paymasterClient.sponsorUserOperation({userOperation})
          }
          catch(error: any) {
            kmsLogger.error("Failed to get paymaster data")
            return {} as GetPaymasterDataReturnType
          }
        }
      }}),
      bundlerTransport: http(
        getBundlerUrl(
          publicClient.chain!.id as ChainId,
          publicClient.chain!.id,
        ),
      ), // Pick first one by default
      userOperation: {
        estimateFeesPerGas: async ({ bundlerClient }) => {
          if(publicClient.chain?.testnet) {
            return getUserOperationGasPrice(bundlerClient)
          }
          return {
            maxFeePerGas: BigInt(0),
            maxPriorityFeePerGas: BigInt(0),
          }
        },
      },
      ...kernelClientConfig,
    });

    return { client, account };
  }
}

// Export default factory instance
export default WalletFactory.getInstance();
