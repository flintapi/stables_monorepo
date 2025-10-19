import { AppRouteHandler } from "@/lib/types"
import type { RampRequest, BankListRequest, TransactionRequest } from "./ramp.routes"
import { BellbankAdapter, FiatPaymentContext, PaymentProvider, } from "@flintapi/shared/Adapters"
import { networkToChainidMap, WalletFactory} from "@flintapi/shared/Utils"
import * as HttpStatusCodes from "stoker/http-status-codes";
import env from "@/env"
import { QueueInstances, QueueNames } from "@flintapi/shared/Queue";

const kmsQueue = QueueInstances[QueueNames.WALLET_QUEUE]

export const ramp: AppRouteHandler<RampRequest> = async (c) => {
  // TODO: add to db, queue and respond with deposit or virtual account depending on the ramp type
  const body = c.req.valid("json")

  switch(body.type) {
    case "off": {
      const { amount, reference, network, destination } = body

      // TODO: Create transaction requirements
      // TODO: Add to transaction db, with transaction metadata
      const chainId = networkToChainidMap[network]
      // TODO: Add job to queue
      const job = await kmsQueue.add("get-address", {chainId, keyLabel: env.MASTER_LABEL_KEY, name: "get-address"})

      // TODO: Get deposit address
      const { address } = job.returnvalue;

      return c.json({
        type: "off",
        status: "pending",
        message: "Off ramp transaction initiated and pending",
        depositAddress: address!
      }, HttpStatusCodes.OK)
    }
    case "on": {
      const {amount, reference, network, destination} = body

      const bankAdapter = new BellbankAdapter();

      const { accountNumber, bankCode, bankName, accountName } = await bankAdapter.createVirtualAccount({
        type: "corporate",
        rcNumber: "1234567890",
        businessName: "",
        emailAddress: "",
        phoneNumber: "",
        bvn: "",
        dateOfBirth: "",
        incorporationDate: ""
      })

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


export const banks: AppRouteHandler<BankListRequest> = async (c) => {

  const provider = PaymentProvider.CENTIIV

  const paymentContext = new FiatPaymentContext(provider)

  const banks = await paymentContext.listBanks()

  return c.json(banks || [{
    institutionName: "BellBank",
    institutionCode: "123456"
  }], HttpStatusCodes.OK)
}

export const transaction: AppRouteHandler<TransactionRequest> = async (c) => {

  return c.json({
    metadata: {},
    status: "pending",
    depositAddress: `0x.....`,
  }, HttpStatusCodes.OK)
}
