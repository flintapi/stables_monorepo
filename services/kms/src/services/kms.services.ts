// NOTE: Holds intereaction for kms service such, creating, deriving and signing transactions
import type { ChainId } from "@flintapi/shared/Utils";
import type { Address, Hex } from "viem";

import { WalletFactory } from "@flintapi/shared/Utils";

class KmsService {
  private static instance: KmsService | null;

  static getInstance() {
    if (!KmsService.instance) {
      KmsService.instance = new KmsService();
    }

    return KmsService.instance;
  }

  async getAddress(keyLabel: string, chainId: ChainId, index?: bigint) {
    const { account } = await WalletFactory.createOrGet({ keyLabel, chainId, index });

    return account.address;
  }

  async transfer(keyLabel: string, chainId: ChainId, contractAddress: Address, data: Hex, index?: bigint) {
    const { client, account } = await WalletFactory.createOrGet({ keyLabel, chainId, index });

    const userOpHash = await client.sendUserOperation({
      callData: await account.encodeCalls([{
        to: contractAddress,
        value: BigInt(0),
        data,
      }]),
    });

    const opReceipt = await client.waitForUserOperationReceipt({ hash: userOpHash });
    return opReceipt.receipt;
  }
}

export default KmsService.getInstance();
