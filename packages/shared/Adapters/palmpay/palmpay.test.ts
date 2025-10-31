import { describe, it, beforeAll } from "vitest";
import palmpayAdapter from "./palmpay.adapter";

/**
 * Stably stringify an object with its keys sorted alphabetically.
 * - Only handles plain JSON-serializable values (objects, arrays, primitives).
 * - Ensures deterministic output by sorting keys at every object level.
 */
function stableStringifySorted(obj: unknown): string {
  const seen = new WeakSet<object>();

  const sortObject = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") {
      return value;
    }

    // Guard against circular references
    if (typeof value === "object") {
      if (seen.has(value as object)) {
        throw new Error("Circular reference detected during stable stringify");
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

// Example usage:
// NOTE: Do NOT hardcode private keys in code. Load from environment or secret manager.
if (require.main === module) {
  const body = {
    amount: 1000,
    currency: "USD",
    meta: { orderId: "ORD-123", customer: "alice" },
    timestamp: 1730134140000,
  };

  // Load from env or a secure path. Example assumes PEM string in env.
  const privateKeyPem =
    process.env.PRIVATE_KEY_PEM ??
    `
-----BEGIN PRIVATE KEY-----
...your-private-key-here...
-----END PRIVATE KEY-----
`.trim();

  if (!privateKeyPem.includes("BEGIN")) {
    throw new Error(
      "Missing RSA private key PEM. Set PRIVATE_KEY_PEM env var.",
    );
  }

  // const { sortedJson, md5UpperHex, signatureBase64 } = generateAuthSignature(
  //   body,
  //   privateKeyPem,
  // );

  // console.log("Sorted JSON:");
  // console.log(sortedJson);
  // console.log("MD5 (uppercase hex):", md5UpperHex);
  // console.log("Signature (base64):", signatureBase64);

  // You might include these in headers like:
  // {
  //   "X-Body-Hash": md5UpperHex,
  //   "X-Signature": signatureBase64,
  //   "Content-Type": "application/json"
  // }
}

describe("Palmpay adapter Test Suit", () => {
  beforeAll(() => {
    // Setup code here
  });

  it("should generate valid request signature and call test URL", async () => {
    // Test code here
  });
});
