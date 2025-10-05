import BellbankAdapter from "./bellbank/bellbank.adapter";
import CentiivAdapter from "./centiiv/centiiv.adapter";

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

export interface FiatPaymentStrategy {
  transfer(request: TransferRequest): Promise<any>;
  nameEnquiry(request: NameEnquiryRequest): Promise<any>;
  listBanks(): Promise<any[]>;
  queryTransaction(reference: string): Promise<any>;
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

  async listBanks(): Promise<any[]> {
    return this.adapter.listBanks();
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

  async listBanks(): Promise<any[]> {
    return this.adapter.listBanks();
  }

  async queryTransaction(reference: string): Promise<any> {
    return this.adapter.getTransaction(reference);
  }
}

export enum PaymentProvider {
  BELLBANK = "bellbank",
  CENTIIV = "centiiv",
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
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  async transfer(request: TransferRequest): Promise<any> {
    return this.strategy.transfer(request);
  }

  async nameEnquiry(request: NameEnquiryRequest): Promise<any> {
    return this.strategy.nameEnquiry(request);
  }

  async listBanks(): Promise<any[]> {
    return this.strategy.listBanks();
  }

  async queryTransaction(reference: string): Promise<any> {
    return this.strategy.queryTransaction(reference);
  }
}
