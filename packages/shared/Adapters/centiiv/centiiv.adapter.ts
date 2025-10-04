// import env from "@/env"
import { createFetch, type BetterFetch } from "@better-fetch/fetch"

export interface TransferDto {
  accountNumber: string;
  bankCode: string;
  reference: string;
  amount: number;
  narration: string;
  accountName?: string;
  bankName?: string;
}

interface CentiivDisbursementInput {
  trackingId: string;
  amount: number;
  currency: `NGN`;
  recipientAccountNumber: string;
  recipientBankCode: string;
  description: string;
}

export default class {
  private fetch: BetterFetch

  constructor() {
    this.fetch = createFetch({
      baseURL: `${process.env.CENTIIV_API_URL}`,
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.CENTIIV_API_KEY}`,
      },
      // retry: {
      //   attempts: 3,
      //   delay: 1000,
      //   type: "linear",
      // },
    })
  }


  async transfer(dto: TransferDto) {
    const disbursements: Array<CentiivDisbursementInput> = [{
      trackingId: dto.reference,
      amount: this.convertToKOBO(dto.amount),
      currency: "NGN",
      recipientAccountNumber: dto.accountNumber,
      recipientBankCode: dto.bankCode,
      description: dto.narration || "Payout",
    }];

    const { data: response, error } = await this.fetch<{
      success: boolean;
      message: string;
      code: string;
      data: any;
    }>("/banking/disburse", {
      method: "POST",
      body: JSON.stringify({
        disbursements,
      }),
    });

    if (error) {
      console.error("Centiiv Disbursment error", error);
      throw error;
    }
    console.log("Disbursement", response);
    return response;
  }

  async nameEnquiry(details: { bankCode: string; accountNumber: string }): Promise<Record<string, any>> {
    const { data: accountDetailsResponse, error } = await this.fetch<{
      success: boolean;
      message: string;
      code: string;
      data: Record<string, any>;
    }>(`/banking/account/${details.bankCode}/${details.accountNumber}`);
    if (error) {
      throw error;
    }

    console.log("Varification Response", accountDetailsResponse);
    return accountDetailsResponse.data;
  }

  async listBanks(): Promise<Array<Record<string, any>>> {
    const { data: bankListResponse, error } = await this.fetch<{
      success: boolean;
      message: string;
      code: string;
      data: Array<Record<string, any>>;
    }>("/banking/banks");
    if (error) {
      throw error;
    }

    return (bankListResponse.data as Array<any>) || [];
  }

  async getTransaction(id: string): Promise<Record<string, any>> {
    if (!this.fetch) {
      throw new Error("Fetch instance not initialized");
    }
    const { data, error } = await this.fetch(`/banking/transaction/${id}`);
    if (error) {
      throw error;
    }
    console.log("Transaction", data);
    return (data as Record<string, any>) || {};
  }


  private convertToKOBO(amount: number): number {
    return (amount * 100); // multiply by 100 to convert to kobo
  }

}
