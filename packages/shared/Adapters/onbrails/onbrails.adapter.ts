/**
* onbrails adapter to create virtual accounts for collection
*/
import { createFetch, type BetterFetch } from "@better-fetch/fetch"; 

interface VirtualAccountInput {
  firstName: string;
  lastName: string;
  bvn: string;
  dateOfBirth: string;
  reference: string;
  customerEmail: string;
  bank: "providus" | "safehaven";
  phoneNumber: string;
}
class OnbrailsAdapter {
  bankCode = '000027';

  private fetch: BetterFetch;
  private ENDPOINT_CONFIGS = {
    collection: '/wallets/collections/initialize',
    virtualAC: '/api/v1/virtual-accounts'
  }

  constructor() {
    this.fetch = createFetch({
      baseURL: `${process.env.ONBRAILS_API_URL}`,
      headers: {
        'authorization': `Bearer ${process.env.ONBRAILS_API_KEY}`
      }
    })
  }

  async createVirtualAccount(payload?: VirtualAccountInput) {
    const defaultVirtualAccountInput: VirtualAccountInput = payload ?? {
      firstName: 'Ramp',
      lastName: 'Collection',
      bvn: '22188691175',
      dateOfBirth: '1995-03-26',
      customerEmail: 'support@flintapi.io',
      reference: crypto.randomUUID(),
      bank: 'providus',
      phoneNumber: '00000000001'
    }
    const {
      data: virtualAccountData,
      error: virtualAccountError
    } = await this.fetch<{
      status: boolean;
      message: string;
      data: {
        id: string;
        createdAt: string;
        updatedAt: string;
        currency: string;
        bank: string;
        customerId: string;
        bankName: string;
        reference: string;
        accountName: string;
        accountNumber: string;
        status: string;
      };
    }>(this.ENDPOINT_CONFIGS.virtualAC, {
      headers: {
        'authorization': `Bearer ${process.env.ONBRAILS_API_KEY}`
      },
      body: defaultVirtualAccountInput
    });

    if(virtualAccountError) {
      throw virtualAccountError.message
    }

    return virtualAccountData.data;
  }
}

export default OnbrailsAdapter;
