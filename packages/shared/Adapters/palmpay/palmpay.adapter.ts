import { BetterFetch, createFetch } from "@better-fetch/fetch";
import { randomBytes } from "node:crypto";
import crypto from "crypto";
import { generateSignature, sortParams } from "./palmpay.utils";
import { TransferRequest } from "Adapters/fiat.payment.strategy";

export interface PalmpayTransferRequest extends TransferRequest {
  organizationId: string;
  transactionId: string;
}

export default class {
  private fetch: BetterFetch;

  constructor() {
    this.fetch = createFetch({
      baseURL: `${process.env.PALMPAY_API_URL}`,
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        countryCode: "NG",
        authorization: `Bearer ${process.env.PALMPAY_APP_ID}`,
      },
    });
  }

  async transfer(dto: {
    orderId: string;
    title?: string;
    description?: string;
    payeeName?: string;
    payeeBankCode: string;
    payeeBankAccNo: string;
    amount: number;
    notifyUrl: string;
    remark: string;
  }) {
    const body = {
      ...this.getDefaultBody(),
      currency: "NGN",
      ...dto,
      amount: (dto.amount*100) // calculate amount kobo
    }

    const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${process.env.PALMPAY_MERCHANT_SK}\n-----END PRIVATE KEY-----`

    const signature = generateSignature(body, privateKeyPEM)
    console.log("PALMPAY SIGNATURE", signature)

    const { data: transferResponse, error } = await this.fetch<{
      respCode: string;
      respMsg: string;
      data: {
        currency: string;
        amount: number;
        fee: { fee: string; };
        orderNo?: string;
        orderId?: string;
        orderStatus: number;
        sessionId: string;
        message?: string;
        errorMsg?: string;
      }
    }>('/merchant/payment/payout', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "CountryCode": "NG",
        "Authorization": `Bearer ${process.env.PALMPAY_APP_ID}`,
      }
    });

    if(error || !transferResponse.data) {
      console.log("Error making transfer:", error, transferResponse);
      throw new Error("Failed to make transfer");
    }

    console.log("Transfer payout details", transferResponse);

    return transferResponse.data;
  }

  async listBanks() {
    const body = {
      ...this.getDefaultBody(),
      version: "V2.0",
      businessType: '0'
    }

    const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${process.env.PALMPAY_MERCHANT_SK}\n-----END PRIVATE KEY-----`

    const signature = generateSignature(body, privateKeyPEM)
    console.log("PALMPAY SIGNATURE", signature)

    const { data: bankList, error } = await this.fetch<{
      respCode: string;
      respMsg: string;
      data: Array<{
        bankCode: string;
        bankName: string;
        bankUrl: string;
        bgUrl: string;
      }>
    }>('/general/merchant/queryBankList', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "CountryCode": "NG",
        "Authorization": `Bearer ${process.env.PALMPAY_APP_ID}`,
      }
    });

    if(error || !bankList.data) {
      console.log("Error fetching bank list:", error, bankList)
      throw new Error("Failed to fetch bank list")
    }

    return bankList.data
  }

  async nameEnquiry(request: { bankCode: string; accountNumber: string; }) {
    const body = {
      ...this.getDefaultBody(),
      bankCode: request.bankCode,
      bankAccNo: request.accountNumber,
    }

    const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${process.env.PALMPAY_MERCHANT_SK}\n-----END PRIVATE KEY-----`

    const signature = generateSignature(body, privateKeyPEM)
    console.log("PALMPAY SIGNATURE", signature)

    const { data: nameEnqResponse, error } = await this.fetch<{
      respCode: string;
      respMsg: string;
      data: {
        Status: string;
        accountName: string;
      }
    }>('/payment/merchant/payout/queryBankAccount', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "CountryCode": "NG",
        "Authorization": `Bearer ${process.env.PALMPAY_APP_ID}`,
      }
    });

    if(error || !nameEnqResponse.data) {
      console.log("Error fetching account name:", error, nameEnqResponse);
      throw new Error("Failed to fetch account details");
    }

    console.log("Account details details", nameEnqResponse);

    return nameEnqResponse.data;
  }

  async getTransaction(reference: string) {
    const body = {
      ...this.getDefaultBody(),
      orderId: reference
    }

    const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${process.env.PALMPAY_MERCHANT_SK}\n-----END PRIVATE KEY-----`

    const signature = generateSignature(body, privateKeyPEM)
    console.log("PALMPAY SIGNATURE", signature)

    const { data: transactionResponse, error } = await this.fetch<{
      respCode: string;
      respMsg: string;
      data: {
        currency: string;
        amount: number;
        fee?: {fee: number};
        orderNo: string;
        orderId: string;
        orderStatus: string;
        sessionId?: string;
        message?: string;
        errorMsg?: string
        createdTime: number;
        completedTime?: number;
      }
    }>('/merchant/payment/queryPayStatus', {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Signature": signature,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "CountryCode": "NG",
        "Authorization": `Bearer ${process.env.PALMPAY_APP_ID}`,
      }
    });

    if(error || !transactionResponse.data) {
      console.log("Error fetching transaction details:", error, transactionResponse)
      throw new Error("Failed to fetch transaction")
    }

    console.log("Transaction details", transactionResponse)

    return transactionResponse.data
  }

  private getDefaultBody() {
    return {
      requestTime: Date.now(),
      version: "V1.1",
      nonceStr: this.generateRandomNonceString(),
    };
  }

  private generateRandomNonceString(): string {
    const randomBuffer = randomBytes(4);
    return randomBuffer.toString("hex");
  }

  /**
   * Stably stringify an object with its keys sorted alphabetically.
   * - Only handles plain JSON-serializable values (objects, arrays, primitives).
   * - Ensures deterministic output by sorting keys at every object level.
   */
  private stableStringifySorted(jsonPayload: Record<string, any>): string {

    // Optional: Sort keys alphabetically
    const sortedKeys = Object.keys(jsonPayload).sort();
    const sortedJsonPayload: any = {};
    sortedKeys.forEach(key => {
        sortedJsonPayload[key] = jsonPayload[key];
    });

    // Convert to URL-encoded string
    const urlEncodedString = Object.keys(sortedJsonPayload)
        .map(key => {
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(sortedJsonPayload[key]);
            return `${encodedKey}=${encodedValue}`;
        })
        .join('&');

    console.log("URL Ecoded sorted string", urlEncodedString);
    return urlEncodedString;

    // const seen = new WeakSet<object>();

    // const sortObject = (value: unknown): unknown => {
    //   if (value === null || typeof value !== "object") {
    //     return value;
    //   }

    //   // Guard against circular references
    //   if (typeof value === "object") {
    //     if (seen.has(value as object)) {
    //       throw new Error(
    //         "Circular reference detected during stable stringify",
    //       );
    //     }
    //     seen.add(value as object);
    //   }

    //   if (Array.isArray(value)) {
    //     // Arrays keep order; recursively sort child objects inside
    //     return value.map(sortObject);
    //   }

    //   // Plain object: sort keys alphabetically and recursively process values
    //   const entries = Object.entries(value as Record<string, unknown>).sort(
    //     ([a], [b]) => a.localeCompare(b),
    //   );

    //   const sortedObj: Record<string, unknown> = {};
    //   for (const [k, v] of entries) {
    //     sortedObj[k] = sortObject(v);
    //   }
    //   return sortedObj;
    // };

    // const sorted = sortObject(obj);
    // return JSON.stringify(sorted);
  }

  /**
   * Compute an MD5 uppercase hex digest for a given input string.
   */
  private md5Upper(input: string): string {
    const digest = crypto.createHash("md5").update(input, "utf8").digest("hex");
    return digest.toUpperCase();
  }

  /**
   * Sign a string using an RSA private key.
   * - Uses RSA-SHA256 by default (recommended). If you must sign the MD5 string with RSA-MD5,
   *   set algorithm to "RSA-MD5" (not recommended due to MD5 weaknesses).
   *
   * Returns base64 signature string appropriate for HTTP headers.
   */
  private signWithRSAPrivateKey(
    data: string,
    privateKeyString: string,
    algorithm: "RSA-SHA256" | "RSA-MD5" | "RSA-SHA1" = "RSA-SHA1",
  ): string {
    console.log("Before sign", privateKeyString, algorithm)

    // Normalize and chunk into 64-char lines for PEM readability
    const cleanBase64 = privateKeyString.replace(/\s+/g, '').trim();
    const chunks = cleanBase64.match(/.{1,64}/g) || [];
    const body = chunks.join('\n');

    const privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----\n${body}\n-----END RSA PRIVATE KEY-----`
    console.log("Private key PEM", privateKeyPem);

    // const keyObject = crypto.createPrivateKey({
    //   key: privateKeyPem,
    //   format: "pem",
    //   type: "pkcs1"
    // })


    const signer = crypto.createSign(algorithm);
    signer.update(data);
    signer.end();

    console.log("Before signer.sign() function call", data)
    const signature = signer.sign(privateKeyPem);
    return signature.toString('hex');
  }

  /**
   * End-to-end function:
   * - Sort keys of body
   * - Stable stringify
   * - MD5 uppercase hash
   * - Sign with RSA private key
   */
  private generateAuthSignature(
    body: Record<string, unknown>,
    privateKeyPem: string,
    options?: { algorithm?: "RSA-SHA256" | "RSA-MD5" },
  ): { sortedJson: string; md5UpperHex: string; signatureBase64: string } {
    const sortedJson = this.stableStringifySorted(body);
    const md5UpperHex = this.md5Upper(sortedJson);
    const signatureBase64 = this.signWithRSAPrivateKey(
      md5UpperHex,
      privateKeyPem,
      options?.algorithm ?? "RSA-SHA1",
    );

    console.log(`Generated palmpay auth strings`, JSON.stringify({
      sortedJson,
      md5UpperHex,
      signatureBase64,
    }, null, 3))

    return { sortedJson, md5UpperHex, signatureBase64 };
  }
}
