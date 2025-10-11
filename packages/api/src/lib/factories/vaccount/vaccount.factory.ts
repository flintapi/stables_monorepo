import { CentiivAdapter, BellbankAdapter } from "@flintapi/shared/Adapters"


class VirtualAccountFactory {
  private static instance: VirtualAccountFactory;
  constructor(
    adapter: CentiivAdapter | BellbankAdapter
  ) { }

  static getInstance() {
    if(!VirtualAccountFactory.instance) {
      VirtualAccountFactory.instance = new VirtualAccountFactory()
    }
    return VirtualAccountFactory.instance;
  }

  // NOTE: only palmpay virtual accounts are used
  async createOrGet(config?: {
    bvn: string;
    name: string;
    email: string;
    phone: string;
  }) {
    // TODO: Implement

    return {
      accountNumber: "09900000000",
      bankCode: '000',
      bankName: 'Palmpay',
      accountName: 'Palmpay Virtual Account'
    }
  }

}

export default VirtualAccountFactory.getInstance()
