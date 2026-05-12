import { BetterFetch, createFetch } from "@better-fetch/fetch";
import { apiLogger } from "Logger";


class PaycrestAdapter {
  static instance: PaycrestAdapter;
  bankCode = "090286";
  fetch: BetterFetch;

  constructor() {
    this.fetch = createFetch({
      baseURL: `https://api.paycrest.io/v2`,
      headers: {
        'content-type': "application/json"
      }
    })
  }

  static getInstance() {
    if (!this.instance)
      this.instance = new PaycrestAdapter()
    return this.instance;
  }

  async onRampInit({
    address,
    amount,
    network,
    reference,
  }: {
    address: `0x${string}`;
    network: 'base' | 'bnb-smart-chain';
    amount: string;
    reference: string;
  }) {
    const { data: onRampOrderResponse, error } = await this.fetch<{
      status: string;
      message: string;
      data: {
        [x: string]: any;
        providerAccount: {
          institution: string,
          accountIdentifier: string,
          accountName: string,
          validUntil: string,
          amountToTransfer: string,
          currency: "NGN"
        }
      }
    }>(`/sender/orders`, {
      method: "post",
      headers: {
        "Api-Key": process.env.PAYCREST_API_KEY!,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        amount,
        amountIn: "fiat",
        reference,
        source: {
          type: "fiat",
          currency: "NGN",
          refundAccount: {
            institution: "GTBINGLA",
            accountIdentifier: "0427930420",
            accountName: "Miracle Friday"
          }
        },
        destination: {
          type: "crypto",
          currency: "CNGN",
          recipient: {
            address,
            network,
          }
        },
      })
    });

    if (error) {
      apiLogger.error(`[Paycrest]: Failed to initiate order`, {
        error
      });
      throw error;
    }

    return onRampOrderResponse?.data.providerAccount;
  }
}


export default PaycrestAdapter.getInstance()
