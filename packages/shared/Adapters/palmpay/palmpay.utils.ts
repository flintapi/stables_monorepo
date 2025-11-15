import crypto from "crypto";
import md5 from "md5";

/**
 * Sorts params alphabetically, removes null/undefined values,
 * excludes the `sign` field, and returns them as a query string.
 *
 * @param {Object} body - The request body
 * @returns {string} Canonicalized string
 */
function sortParams(body: any) {
  return Object.keys(body)
    .sort()
    .filter(
      (key) =>
        key !== "sign" &&
        body[key] !== null &&
        body[key] !== undefined &&
        body[key] !== ""
    )
    .map((key) => `${key}=${body[key]}`)
    .join("&");
}

/**
 * Builds the message digest (MD5 hash in uppercase).
 *
 * @param {Object} body - The request body
 * @returns {string} MD5 hash (uppercase)
 */
function buildDigest(body: any) {
  const sortedParameters = sortParams(body);
  console.log("Soorted Parameters: ", sortedParameters);
  const md5Hash = md5(sortedParameters).toUpperCase();
  console.log("Message Digest: ", md5Hash);
  return md5Hash;
}

/**
 * Generate an RSA-SHA1 signature from request body.
 *
 * @param {Object} requestBody - The request body
 * @param {string} privateKeyPEM - Private key in PEM format
 * @returns {string} Base64-encoded signature
 */
function generateSignature(requestBody: any, privateKeyPEM: string) {
  if (!privateKeyPEM) throw new Error("Private key is required");

  const digest = buildDigest(requestBody);
  const signer = crypto.createSign("RSA-SHA1");
  signer.update(digest);
  signer.end();

  return signer.sign(privateKeyPEM, "base64");
}

/**
 * Verify RSA-SHA1 signature.
 *
 * @param {Object} requestBody - The request body (must include `sign`)
 * @param {string} publicKeyPEM - Public key in PEM format
 * @returns {boolean} True if signature is valid, false otherwise
 */
function verifySignature(requestBody: any, publicKeyPEM: string) {
  if (!publicKeyPEM) throw new Error("Public key is required");
  if (!requestBody.sign)
    throw new Error("Signature (`sign`) is missing from request body");

  const digest = buildDigest(requestBody);
  const signature = decodeURIComponent(requestBody.sign);

  const verifier = crypto.createVerify("RSA-SHA1");
  verifier.update(digest);
  verifier.end();

  return verifier.verify(publicKeyPEM, signature, "base64");
}

export { sortParams, generateSignature, verifySignature };
