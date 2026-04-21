import { BetterFetch, createFetch } from "@better-fetch/fetch"
import { boolean } from "drizzle-orm/singlestore-core";
import { apiLogger } from "Logger";
import { string } from "zod";

type Network = "base" | "bsc";
type Asset = "cngn";
type Channel = "BANK";

const DEVELOPER_FEE = 0.10;

class SwitchAdapter {
  static instance: SwitchAdapter;
  fetch: BetterFetch;

  constructor() {
    this.fetch = createFetch({
      baseURL: `https://api.onswitch.xyz`,
      headers: {
        "content-type": "application/json"
      }
    })
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SwitchAdapter()
    }
    return this.instance;
  }

  async offrampQuote(asset: `${Network}:${Asset}`, channel: Channel = 'BANK', amount: number, country: string = 'NG') {
    const { data: offrampResponse, error } = await this.fetch<{
      success: boolean,
      message: string,
      timestamp: string,
      data: {
        expiry: string,
        settlement: string,
        channel: "BANK",
        rate: number,
        source: {
          amount: number,
          currency: string,
          network: string
        },
        destination: {
          amount: number,
          currency: string,
          network: string
        }
      }
    }>('/offramp/quote', {
      method: "post",
      body: {
        amount,
        asset,
        country,
        channel,
        "exact_output": false,
        "developer_fee": 0.1
      },
      headers: {
        "x-service-key": process.env.SWITCH_SERVICE_KEY!,
        "content-type": "application/json"
      },
    });

    if (error) {
      apiLogger.error(`Failed to get off-ramp quote`, {
        error
      })
      throw error;
    }

    return offrampResponse.data;
  }

  async offrampInit({
    asset,
    amount,
    beneficiary,
    callback_url,
    sender_name,
    reference,
    reason = "REMITTANCES",
    channel = 'BANK',
    country = 'NG',
    currency = 'NGN'
  }: {
      asset: `${Network}:${Asset}`;
      amount: number;
      beneficiary: {
        holder_type: "INDIVIDUAL";
        holder_name: string;
        account_number: string;
        bank_code: string;
      };
      callback_url: string;
      sender_name: string;
      reference: string;
      reason?: string;
      channel?: Channel;
      country?: string;
      currency?: string;
    }) {
      const { data: offrampInitResponse, error } = await this.fetch<{
        success: boolean;
        message: string;
        timestamp: string;
        data: {
          status: string;
          type: string;
          reference: string;
          beneficiary: string;
          rate: number;
          developer_fee: {
            amount: number;
            amount_usd: number;
            currency: string;
            network: string;
            recipient: string;
          };
          source: {
            amount: number;
            amount_usd: number;
            network: string;
            currency: string;
          };
          destination: {
            amount: number;
            amount_usd: number;
            network: string;
            currency: string;
          };
          deposit: {
            amount: number;
            address: string;
            asset: string;
            note: string[];
          };
          meta: any;
          created_at: string;
          updated_at: string;
        }
      }>('/offramp/initiate', {
        method: "post",
        body: JSON.stringify({
          amount,
          asset,
          country,
          channel,
          currency,
          beneficiary,
          callback_url,
          sender_name,
          reference,
          reason,
          exact_output: false,
          developer_fee: 0.1,
          static: false,
        }),
        headers: {
          "x-service-key": process.env.SWITCH_SERVICE_KEY!,
          "content-type": "application/json"
        },
      });

      if (error) {
        apiLogger.error(`Failed to initiate off-ramp request`, {
          error
        })
        throw error;
      }

      return offrampInitResponse.data;
  }

}


export default SwitchAdapter.getInstance()
