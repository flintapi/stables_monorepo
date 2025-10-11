import type { BetterFetch } from "@better-fetch/fetch";

import { createFetch } from "@better-fetch/fetch";

import env from "@/env";

interface CreateVirtualAccountDto {
  firstname: string;
  lastname: string;
  phoneNumber: string;
  address: string;
  bvn: string;
  gender: string;
  dateOfBirth: string;
  metadata?: Record<string, any>;
}

interface NameEnquiryDto {
  accountNumber: string;
  bankCode: string;
}

interface TransferDto {
  beneficiaryAccountNumber: string;
  beneficiaryBankCode: string;
  amount: number;
  narration: string;
  reference: string;
  senderName?: string;
}

class BellBankAdapter {
  private fetch: BetterFetch;
  private token: string | null = null;
  // private tokenInterval: NodeJS.Timeout;

  constructor() {
    console.log(`Bellbank API_URL`, env.BELLBANK_API_URL);
    this.fetch = createFetch({
      baseURL: `${env.BELLBANK_API_URL}`,
      // retry: {
      //   attempts: 3,
      //   delay: 1000,
      //   type: "linear",
      // },
    });
  }

  private async getToken() {
    if (!this.token) {
      const { data, error } = await this.fetch<{
        success: boolean;
        message: string;
        token: string;
      }>("/v1/generate-token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "consumerKey": env.BELLBANK_CK!,
          "consumerSecret": env.BELLBANK_CS!,
          "validityTime": "30",
        },
      });

      if (error) {
        console.log("Token error", error);
        throw error;
      }
      this.token = data.token;
      return this.token;
    }

    return this.token;
  }

  async createVirtualAccount(dto: CreateVirtualAccountDto) {
    const token = await this.getToken();
    const { data, error } = await this.fetch<{
      success: boolean;
      data: Record<string, any>;
    }>(`/v1/account/clients/individual`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        firstname: dto.firstname,
        lastname: dto.lastname,
        phoneNumber: dto.phoneNumber,
        address: dto.address,
        bvn: dto.bvn,
        gender: dto.gender, // male | female
        dateOfBirth: dto.dateOfBirth, // 1993/12/29
        metadata: dto.metadata,
      },
    });

    if (error) {
      console.log("Error creating a virtual account", error);
      throw error;
    }

    return data.data;
  }

  async nameEnquiry(dto: NameEnquiryDto) {
    const token = await this.getToken();
    const { data, error } = await this.fetch<{
      success: boolean;
      data: Record<string, any>;
    }>(`/v1/transfer/name-enquiry`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        ...dto,
      },
    });

    if (error) {
      console.log("Error in name enquiry", error);
      throw error;
    }

    return data.data;
  }

  async transfer(dto: TransferDto) {
    const token = await this.getToken();

    const { data, error } = await this.fetch<{
      success: boolean;
      message: string;
      data: Record<string, any>;
    }>(`/v1/transfer`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...dto,
      }),
    });

    if (error) {
      throw error;
    }

    return data.data;
  }

  async queryTransaction(dto: { reference: string }) {
    const token = await this.getToken();

    const { data, error } = await this.fetch<{
      success: boolean;
      message: string;
      data: Record<string, any>;
    }>(`/v1/transactions/reference/${dto.reference}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      throw error;
    }

    return data.data;
  }

  async transactions() {
    const token = await this.getToken();
    console.log("Token", token);
    const { data, error } = await this.fetch<{
      success: boolean;
      data: Array<Record<string, any>>;
    }>(`/v1/transactions`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      console.log("Error in transactions list", error);
      throw error;
    }

    return data.data;
  }

  async listBanks() {
    const token = await this.getToken();

    const { data, error } = await this.fetch<{
      success: boolean;
      message: string;
      data: Array<{ institutionCode: string; institutionName: string; category: string }>;
    }>(`/v1/transfer/banks`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      console.log("error listing banks", error);
      throw error;
    }

    return data.data;
  }
}

export default BellBankAdapter;
