import { BetterFetch, createFetch } from "@better-fetch/fetch"
import { apiLogger } from "Logger";
import { env } from "process";

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

  async offrampInit() { }

}


export default SwitchAdapter.getInstance()
