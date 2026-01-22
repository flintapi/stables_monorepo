import crypto from "node:crypto"
import type {AppRouteHandler} from "@/lib/types"
import type {CreateAutofundRoute} from "./spec-ops.routes"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { OrgMetadata } from "@flintapi/shared/Utils"
import { OnbrailsAdapter } from "@flintapi/shared/Adapters"
import { cacheVirtualAccount } from "../ramp/ramp.utils"
import { apiLogger } from "@flintapi/shared/Logger"
import { Address } from "viem"


export const createAutofunder: AppRouteHandler<CreateAutofundRoute> = async (c) => {
  try {
    const organization = c.get('organization')
    // const orgDatabase = c.get('orgDatabase')
    // const metadata: OrgMetadata = typeof organization.metadata !== 'string'? organization.metadata : JSON.parse(organization.metadata)
    // const orgDatabase = orgDb({
    //   dbUrl: metadata?.dbUrl
    // });
    
    const body = c.req.valid("json")

    const bankAdapter = new OnbrailsAdapter();

    const bankCode = bankAdapter.bankCode;
    const reference = crypto.randomUUID()
    const { accountNumber, accountName, bankName } =
    await bankAdapter.createVirtualAccount({...body, reference, bank: "providus" });
    await cacheVirtualAccount(accountNumber, {
      organizationId: organization.id,
      autofundData: {
        address: body.autofundAddress as Address,
        network: body.network,
        notifyUrl: body?.notifyUrl
      }
    });
    return c.json({
      message: `Autofund account created successful`,
      status: "success",
      data: {
        accountName,
        accountNumber,
        accountReference: reference,
        bankName: bankName,
        bankCode
      }
    }, HttpStatusCodes.OK)
  }
  catch(error: any) {
    apiLogger.error(`Failed to create auto fund account`, {error, requedId: c.get('requestId')})
    return c.json({
      message: `Failed to create auto fund account`,
      status: "failed",
      data: null,
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
  }
}
