import { BetterFetch, createFetch } from "@better-fetch/fetch";
import { randomBytes } from "node:crypto";
import crypto from "crypto";

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

  async transfer(dto: any) {
    const { signatureBase64, sortedJson, md5UpperHex } =
      this.generateAuthSignature(dto, process.env.PALMPAY_SK!);
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
  private stableStringifySorted(obj: unknown): string {
    const seen = new WeakSet<object>();

    const sortObject = (value: unknown): unknown => {
      if (value === null || typeof value !== "object") {
        return value;
      }

      // Guard against circular references
      if (typeof value === "object") {
        if (seen.has(value as object)) {
          throw new Error(
            "Circular reference detected during stable stringify",
          );
        }
        seen.add(value as object);
      }

      if (Array.isArray(value)) {
        // Arrays keep order; recursively sort child objects inside
        return value.map(sortObject);
      }

      // Plain object: sort keys alphabetically and recursively process values
      const entries = Object.entries(value as Record<string, unknown>).sort(
        ([a], [b]) => a.localeCompare(b),
      );

      const sortedObj: Record<string, unknown> = {};
      for (const [k, v] of entries) {
        sortedObj[k] = sortObject(v);
      }
      return sortedObj;
    };

    const sorted = sortObject(obj);
    return JSON.stringify(sorted);
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
    privateKeyPem: string,
    algorithm: "RSA-SHA256" | "RSA-MD5" | "RSA-SHA1" = "RSA-SHA1",
  ): string {
    const signer = crypto.createSign(algorithm);
    signer.update(data, "utf8");
    signer.end();
    const signature = signer.sign(privateKeyPem);
    return signature.toString("base64");
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
      options?.algorithm ?? "RSA-SHA256",
    );

    return { sortedJson, md5UpperHex, signatureBase64 };
  }
}
