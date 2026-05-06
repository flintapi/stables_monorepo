import { ChainId, TOKEN_ADDRESSES } from "@flintapi/shared/Utils";
import "./workers/kp.worker";
import { Address, encodeFunctionData, parseAbi, parseUnits } from "viem"
import {base} from "viem/chains"
import kmsService from "./services/kms.services"
import { kmsLogger } from "@flintapi/shared/Logger";
import env from "./env";



async function main() {
  // TODO: run script to send tokens for treasury management

  const BscDestination = `0xdc338f02185f09086985aFc26264B3AC47CDb406`;
  const BaseDestination = `0xdc338f02185f09086985aFc26264B3AC47CDb406`; //`0x107a7F8d51F75f48082294E8FacEdcc1C29CCca3`; //`0xC5dDD7A035fC6e664f0E8f18299fB09f8766676e`;
  const BSC_AMOUNT = 30_000;
  const BASE_AMOUNT = 20_000;

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


  for (const data of Object.values({ BSC_DATA })) {
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
      kmsLogger.info(`Explorer URL`, {
        url: `${base.blockExplorers.default.url}/tx/${receipt.transactionHash}`
      })
    }
    catch (error: any) {
      kmsLogger.error("Failed to transfer from treasury", error)
      throw error;
    }

  }

}


// To run
main()
  .catch(kmsLogger.error)
