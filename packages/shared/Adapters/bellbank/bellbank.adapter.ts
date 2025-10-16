import type { BetterFetch } from "@better-fetch/fetch";

import { createFetch } from "@better-fetch/fetch";
// import env from "@/env";

type CreateVirtualAccountDto = ({
  type: "individual";
  firstname: string;
  lastname: string;
  phoneNumber: string;
  address: string;
  bvn: string;
  gender: string;
  dateOfBirth: string;
  metadata?: Record<string, any>;
} | {
  type: "corporate";
  rcNumber: string;
  businessName: string;
  emailAddress: string;
  phoneNumber: string;
  address?: string;
  bvn: string;
  incorporationDate: string;
  dateOfBirth: string;
  metadata?: string;
});

interface CorporateVirtualAccountResponse {
  success: boolean;
  data: {
    metadata: any;
    createdAt: number;
    updatedAt: number;
    id: any;
    businessName: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
    rcNumber: string;
    incorporationDate: string;
    mobileNumber: string;
    externalReference: string;
    emailAddress: string;
    bvn: string;
    dateOfBirth: string;
    address: string;
    validityType: string;
    [key: string]: any;
  };
}

interface IndividualVirtualAccountResponse {
  success: boolean;
  data: {
    metadata: any;
    createdAt: number;
    updatedAt: number;
    id: any;
    accountNumber: string;
    accountName: string;
    accountType: string;
    firstname: string;
    lastname: string;
    middlename: string;
    mobileNumber: string;
    externalReference: string;
    emailAddress: string;
    bvn: string;
    gender: string;
    address: string;
    dateOfBirth: string;
    validityType: string;
    [key: string]: any;
  };
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

export default class {
  private fetch: BetterFetch;
  private token: string | null = null;
  // private tokenInterval: NodeJS.Timeout;

  constructor() {
    console.log(`Bellbank API_URL`, process.env.BELLBANK_API_URL);
    this.fetch = createFetch({
      baseURL: `${process.env.BELLBANK_API_URL}`,
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
          "consumerKey": process.env.BELLBANK_CK!,
          "consumerSecret": process.env.BELLBANK_CS!,
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

    const { type } = dto;

    switch (type) {
      case "individual": {
        const { data, error } = await this.fetch<IndividualVirtualAccountResponse>(`/v1/account/clients/individual`, {
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
      };
      case "corporate": {
        const { data, error } = await this.fetch<CorporateVirtualAccountResponse>(`/v1/account/clients/corporate`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: {
            rcNumber: dto.rcNumber,
            businessName: dto.businessName,
            emailAddress: dto.emailAddress,
            phoneNumber: dto.phoneNumber,
            address: dto.address,
            bvn: dto.bvn,
            incorporationDate: dto.incorporationDate,
            dateOfBirth: dto.dateOfBirth,
            metadata: dto.metadata,
          },
        });

        if (error) {
          console.log("Error creating a virtual account", error);
          throw error;
        }

        return data.data;
      };
      default: {
        throw new Error("Invalid account type");
      }
    }
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

    console.log("Token", token);

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

    console.log("Banks", data.data);

    return data.data;
  }
}
