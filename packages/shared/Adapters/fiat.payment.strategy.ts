import BellbankAdapter from "./bellbank/bellbank.adapter";
import CentiivAdapter from "./centiiv/centiiv.adapter";
import PalmpayAdapter, { PalmpayTransferRequest } from "./palmpay/palmpay.adapter";
import OnbrailsAdapter from "./onbrails/onbrails.adapter"; 

export interface TransferRequest {
  accountNumber: string;
  bankCode: string;
  reference: string;
  amount: number;
  narration: string;
  accountName?: string;
  bankName?: string;
}

export interface NameEnquiryRequest {
  accountNumber: string;
  bankCode: string;
}

export interface FiatPaymentStrategy<ExtendTRequest extends TransferRequest = TransferRequest> {
  transfer(request: ExtendTRequest): Promise<any>;
  nameEnquiry: (request: NameEnquiryRequest) => Promise<any>;
  listBanks: () => Promise<{ institutionCode: string; institutionName: string }[]>;
  queryTransaction: (reference: string) => Promise<any>;
}



export class BellbankPaymentStrategy implements FiatPaymentStrategy {
  private adapter: BellbankAdapter;

  constructor() {
    this.adapter = new BellbankAdapter();
  }

  async transfer(request: TransferRequest): Promise<any> {
    return this.adapter.transfer({
      beneficiaryAccountNumber: request.accountNumber,
      beneficiaryBankCode: request.bankCode,
      amount: request.amount,
      narration: request.narration,
      reference: request.reference,
    });
  }

  async nameEnquiry(request: NameEnquiryRequest): Promise<any> {
    return this.adapter.nameEnquiry(request);
  }

  async listBanks(): Promise<{ institutionCode: string; institutionName: string }[]> {
    const banks = await this.adapter.listBanks();

    return banks.map(bank => ({
      institutionCode: bank.institutionCode,
      institutionName: bank.institutionName,
    }));
  }

  async queryTransaction(reference: string): Promise<any> {
    return this.adapter.queryTransaction({ reference });
  }
}

export class CentiivPaymentStrategy implements FiatPaymentStrategy {
  private adapter: CentiivAdapter;

  constructor() {
    this.adapter = new CentiivAdapter();
  }

  async transfer(request: TransferRequest): Promise<any> {
    return this.adapter.transfer(request);
  }

  async nameEnquiry(request: NameEnquiryRequest): Promise<any> {
    return this.adapter.nameEnquiry(request);
  }

  async listBanks(): Promise<{ institutionCode: string; institutionName: string }[]> {
    const banks = await this.adapter.listBanks();

    return banks.map(bank => ({
      institutionCode: bank.code,
      institutionName: bank.name,
    }));
  }

  async queryTransaction(reference: string): Promise<any> {
    return this.adapter.getTransaction(reference);
  }
}

export class PalmpayPaymentStrategy implements FiatPaymentStrategy<PalmpayTransferRequest> {
  private adapter: PalmpayAdapter;

  constructor() {
    this.adapter = new PalmpayAdapter();
  }

  async transfer(request: PalmpayTransferRequest): Promise<any> {
    return this.adapter.transfer({
      amount: request.amount,
      payeeBankAccNo: request.accountNumber,
      payeeBankCode: request.bankCode,
      payeeName: request.accountName,
      remark: request.narration,
      orderId: request.reference,
      notifyUrl: 'organizationId' in request && 'transactionId' in request
        ? `${process.env.API_GATEWAY_URL}/webhooks/palmpay/payment/${request.organizationId}/${request.transactionId}`
        : `${process.env.API_GATEWAY_URL}/webhooks/palmpay/payment`
    });
  }

  async nameEnquiry(request: NameEnquiryRequest): Promise<string> {
    const response = await this.adapter.nameEnquiry(request);
    return response.accountName;
  }

  async listBanks(): Promise<{ institutionCode: string; institutionName: string }[]> {
    try {
      const banks = await this.adapter.listBanks();

      return banks.map(bank => ({
        institutionCode: bank.bankCode,
        institutionName: bank.bankName,
      }));
    }
    catch(error: any) {
      console.log("Failed to get palmpay bank list", error);
      throw error;
    }
  }

  async queryTransaction(reference: string): Promise<any> {
    return this.adapter.getTransaction(reference);
  }
}

export enum PaymentProvider {
  BELLBANK = "bellbank",
  CENTIIV = "centiiv",
  PALMPAY = "palmpay"
}

export class FiatPaymentContext {
  private strategy: FiatPaymentStrategy;

  constructor(provider: PaymentProvider) {
    switch (provider) {
      case PaymentProvider.BELLBANK:
        this.strategy = new BellbankPaymentStrategy();
        break;
      case PaymentProvider.CENTIIV:
        this.strategy = new CentiivPaymentStrategy();
        break;
      case PaymentProvider.PALMPAY:
        this.strategy = new PalmpayPaymentStrategy();
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  setStrategy(provider: PaymentProvider): void {
    switch (provider) {
      case PaymentProvider.BELLBANK:
        this.strategy = new BellbankPaymentStrategy();
        break;
      case PaymentProvider.CENTIIV:
        this.strategy = new CentiivPaymentStrategy();
        break;
      case PaymentProvider.PALMPAY:
        this.strategy = new PalmpayPaymentStrategy();
        break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  async transfer(request: TransferRequest | PalmpayTransferRequest): Promise<any> {
    return this.strategy.transfer(request);
  }

  async nameEnquiry(request: NameEnquiryRequest): Promise<any> {
    return this.strategy.nameEnquiry(request);
  }

  async listBanks(): Promise<{ institutionCode: string; institutionName: string }[]> {
    return this.strategy.listBanks();
  }

  async queryTransaction(reference: string): Promise<any> {
    return this.strategy.queryTransaction(reference);
  }
}
