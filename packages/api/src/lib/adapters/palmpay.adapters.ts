import env from "@/env";
import { createFetch, type BetterFetch } from "@better-fetch/fetch";
import { PaymentProvider } from "./adapters.entities";


class PalmpayAdapter implements PaymentProvider {
  private fetch: BetterFetch

  constructor() {
    this.fetch = createFetch({
      baseURL: `${env.PALMPAY_URL}`,
      headers: {
        "content-type": "application/json",
      }
    })
  }

  async transfer(amount: number, recipient: string): Promise<void> {
    await this.fetch("/transfer", {
      method: "POST",
      body: JSON.stringify({
        amount,
        recipient
      })
    });
  }

  async nameEnquiry({ bankCode, accountNumber }: { bankCode: string;  accountNumber: string}) {
    const {data, error} = await this.fetch<Record<string, any>>(`/name-finding`, {
      method: "POST",
      body: JSON.stringify({
        bankCode,
        accountNumber
      })
    })

    if(error) {
      throw error;
    }

    return data
  }

  async listBanks() {
    const {data, error} = await this.fetch<Array<Record<string, any>>>(`/list-banks`, {
      method: "GET",
    })

    if(error) {
      throw error;
    }

    return data
  }

  async getTransaction(id: string) {
    const {data, error} = await this.fetch<Record<string, any>>(`/get-trx`, {
      method: "GET",
      headers: {
        "authorization": `Bearer ${getSignature({id})}`
      }
    })

    if(error) {
      throw error;
    }

    return data
  }
}


function getSignature(data: any) {
  return data.toString();
}

export default PalmpayAdapter;
