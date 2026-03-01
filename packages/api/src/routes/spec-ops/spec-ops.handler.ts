import crypto from "node:crypto"
import type {AppRouteHandler} from "@/lib/types"
import type {CreateAutofundRoute, ExecuteTrade, GetTradeQuote} from "./spec-ops.routes"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { OrgMetadata, orgSchema } from "@flintapi/shared/Utils"
import { OnbrailsAdapter } from "@flintapi/shared/Adapters"
import { cacheVirtualAccount } from "../ramp/ramp.utils"
import { apiLogger } from "@flintapi/shared/Logger"
import { Address } from "viem"
import { betterFetch } from "@better-fetch/fetch"
import env from "@/env"
import { orgDb } from "@/db"


export const createAutofunder: AppRouteHandler<CreateAutofundRoute> = async (c) => {
  try {
    const organization = c.get('organization')
    const webhookSecret = c.get('webhookSecret')
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
        notifyUrl: body?.notifyUrl,
        webhookSecret
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

const INTERNAL_DEV_FEE = 0.2;
export const getTradeQuote: AppRouteHandler<GetTradeQuote> = async (c) => {
  try {
    const body = c.req.valid('json')
    const { data: quoteResponse, error } = await betterFetch<{
      success: true,
      message: "Quote fetched successfully",
      timestamp: string,
      data: {
        rate: number,
        expiry: string,
        settlement: string,
        channel: string,
        fee: {
          total: number,
          platform: number,
          developer: number,
          currency: string
        },
        fee_inclusive: boolean,
        source: {
          amount: number,
          currency: string
        },
        destination: {
          amount: number,
          currency: string
        }
      }
    }, Error | unknown>(`${env.SWITCH_URL}/onramp/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": `${env.SWITCH_API_KEY}`
      },
      body: JSON.stringify({
        amount: body.amount,
        country: "NG",
        asset: "base:usdc",
        currency: body.currency ?? "NGN",
        channel: "BANK",
        exact_output: false,
        developer_fee: INTERNAL_DEV_FEE + (body?.feePercent ?? 0)
      })
    })

    if(error) {
      apiLogger.error(`Failed to get trade quote`, {error, requedId: c.get('requestId')})
      return c.json({
        message: `Failed to get trade quote`,
        status: "failed",
        data: null,
      }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }

    return c.json({
      message: "Quote fetched successfully",
      status: "success",
      data: {
        rate: quoteResponse.data.rate,
        expiry: quoteResponse.data.expiry,
        source: quoteResponse.data.source,
        destination: quoteResponse.data.destination
      },
    })
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

export const executeTrade: AppRouteHandler<ExecuteTrade> = async (c) => {
  try {
    const body = c.req.valid('json')
    interface NewType {
      success: boolean
      message: string
      timestamp: string
      data: {
        status: string
        type: string
        reference: string
        rate: number
        fee: {
          total: number
          platform: number
          developer: number
          currency: string
        }
        source: {
          amount: number
          currency: string
        }
        destination: {
          amount: number
          currency: string
        }
        deposit: {
          bank_name: string
          bank_code: string
          account_name: string
          account_number: string
          note: string[]
        }
      }
    }

    // TODO: Store transaction in DB
    const organization = c.get('organization')
    const webhookSecret = c.get('webhookSecret')
    // const orgDatabase = c.get('orgDatabase')
    const metadata: OrgMetadata = typeof organization.metadata !== 'string'? organization.metadata : JSON.parse(organization.metadata)
    const orgDatabase = orgDb({
      dbUrl: metadata?.dbUrl
    });

    const { data: executeResponse, error } = await betterFetch<NewType, Error | unknown>(`${env.SWITCH_URL}/onramp/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": `${env.SWITCH_API_KEY}`
      },
      body: JSON.stringify({
        amount: body.amount,
        country: "NG",
        currency: "NGN",
        asset: `${body.network}:${body.asset}`,
        beneficiary: {
          holder_type: "INDIVIDUAL",
          holder_name: "Julie Dane",
          wallet_address: body.destination.address
        },
        exact_output: false,
        callback_url: `${env.API_GATEWAY_URL}/webhooks/switch/${organization.id}/${body.reference}`,
        reference: body.reference,
        channel: "BANK",
        reason: "REMITTANCES",
        developer_fee: INTERNAL_DEV_FEE + (body?.feePercent ?? 0)
      })
    })

    if(error) {
      apiLogger.error(`Failed to execute trade`, {error, requedId: c.get('requestId')})
      return c.json({
        message: `Failed to execute trade`,
        status: "failed",
        data: null,
      }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }

    // Update DB
    await orgDatabase
      .insert(orgSchema.transactions)
      .values({
        type: "on-ramp",
        status: "pending",
        network: body.network,
        reference: body.reference,
        amount: body.amount,
        metadata: {
          isDestinationExternal: true,
          asset: body.asset,
          address: body.destination.address,
          collectionBankCode: executeResponse.data.deposit.bank_code,
          collectionAccountNumber: executeResponse.data.deposit.account_number,
          collectionBankName: executeResponse.data.deposit.bank_name,
          notifyUrl: body.notifyUrl,
          webhookSecret,
        },
      })
      .returning();

    return c.json({
      message: "Quote fetched successfully",
      status: "success",
      data: {deposit: executeResponse.data.deposit},
    })
  }
  catch(error: any) {
    apiLogger.error(`Failed to execute trade`, {error, requedId: c.get('requestId')})
    return c.json({
      message: `Failed to execute trade`,
      status: "failed",
      data: null,
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
  }
}
