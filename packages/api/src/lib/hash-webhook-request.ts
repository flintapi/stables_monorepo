import crypto from "node:crypto";

export function signWithSecretkey(body: any, key: string): string {
  return crypto.createHmac("sha512", key)
    .update(JSON.stringify(body))
    .digest("hex");
}
