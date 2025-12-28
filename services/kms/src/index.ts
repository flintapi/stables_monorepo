import { ChainId, TOKEN_ADDRESSES } from "@flintapi/shared/Utils";
import "./workers/kp.worker";
import { Address, encodeFunctionData, parseAbi, parseUnits } from "viem"
import kmsService from "./services/kms.services"
import { kmsLogger } from "@flintapi/shared/Logger";
import env from "./env";



async function main() {
  // TODO: run script to send tokens for treasury management

  const BscDestination = `0xCEF2C867afb682e0A325E6C09211Dfee1f65A4b6`;
  const BaseDestination = `0xC5dDD7A035fC6e664f0E8f18299fB09f8766676e`;
  const BSC_AMOUNT = 3_000_000;
  const BASE_AMOUNT = 20_000_000;

  const BSC_DATA = {
    destination: BscDestination,
    amount: BSC_AMOUNT,
    contractAddress: TOKEN_ADDRESSES[56].cngn.address,
    decimal: TOKEN_ADDRESSES[56].cngn.decimal,
    chainId: 56
  }
  const BASE_DATA = {
    destination: BaseDestination,
    amount: BASE_AMOUNT,
    contractAddress: TOKEN_ADDRESSES[8453].cngn.address,
    decimal: TOKEN_ADDRESSES[8453].cngn.decimal,
    chainId: 8453
  }


  for (const data of Object.values({ BASE_DATA })) {
    try {
      const receipt = await kmsService.transfer(
        env.TREASURY_KEY_LABEL,
        data.chainId as ChainId,
        data.contractAddress as Address,
        encodeFunctionData({
          abi: parseAbi([
            "function transfer(address to, uint256 amount) external returns (bool)",
          ]),
          functionName: "transfer",
          args: [
            data.destination! as Address,
            parseUnits(data.amount.toString(), data.decimal),
          ],
        }),
      );

      kmsLogger.info(`Receipt for chain with ID ${data.chainId}`, receipt)
      kmsLogger.info(`Hash for chain ID`, {hash: receipt.transactionHash})
    }
    catch (error: any) {
      kmsLogger.error("Failed to transfer from treasury", error)
      throw error;
    }

  }

}


// main()
//   .catch(kmsLogger.error)
