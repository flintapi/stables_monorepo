import { AppRouteHandler } from "@/lib/types"
import type { RampRequest } from "./ramp.routes"
import WalletFactory from "@/lib/factories/wallet/wallet.factory"
import { networkToChainidMap } from "@/lib/factories/wallet/wallet.constants"
import * as HttpStatusCodes from "stoker/http-status-codes";
import env from "@/env"

export const ramp: AppRouteHandler<RampRequest> = async (c) => {
  // TODO: add to db, queue and respond with deposit or virtual account depending on the ramp type
  const body = c.req.valid("json")

  switch(body.type) {
    case "off": {
      const { amount, reference, network, destination } = body

      // TODO: Add to db
      // TODO: get deposit address
      const account = await WalletFactory.createOrGet({
        chainId: networkToChainidMap[network],
        keyLabel: env.MASTER_LABEL_KEY
      })

      // TODO: Add job to queue
      const address = account.address

      return c.json({
        type: "off",
        status: "pending",
        message: "Off ramp transaction initiated and pending",
        depositAddress: address
      }, HttpStatusCodes.OK)
    }
    case "on": {
      const {amount, reference, network, destination} = body

      const { accountNumber, bankCode, bankName, accountName } = await VirtualAccountFactory.createOrGet()

      // TODO: Add transaction to DB

      // TODO: Add job to queue

      return c.json({
        type: "on",
        status: "pending",
        message: "On ramp transaction initiated and pending",
        depositAccount: {
          accountNumber: accountNumber as string,
          accountName,
          bankCode: bankCode as string,
          bankName
        }
      }, HttpStatusCodes.OK)
    }
  }
}
