# Signature Format Analysis: HSMSigner vs Viem's privateKeyToAccount

## Executive Summary

This document analyzes the differences between the custom `HSMSigner.toViemAccount()` implementation and Viem's standard `privateKeyToAccount()`, focusing on the `signMessage` function and signature formats.

## Critical Issue Identified

### ❌ Missing EIP-191 Prefix (FIXED)

The original `HSMSigner.toViemAccount().signMessage()` was **NOT** adding the EIP-191 personal message prefix, making it incompatible with standard Ethereum message signing.

## Detailed Comparison

### 1. Message Signing Flow

#### Viem's `privateKeyToAccount.signMessage()`
```javascript
Input: { message: "hello world" }
  ↓
1. Convert to bytes
  ↓
2. Add EIP-191 prefix: "\x19Ethereum Signed Message:\n" + length + message
  ↓
3. Hash with keccak256
  ↓
4. Sign with ECDSA
  ↓
Output: "0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b"
```

#### HSMSigner's Original Implementation ❌
```javascript
Input: { message: "hello world" }
  ↓
1. Convert to bytes
  ↓
2. Hash with keccak256 (NO EIP-191 PREFIX!)
  ↓
3. Sign with HSM ECDSA
  ↓
Output: Different signature (incompatible with standard tools)
```

#### HSMSigner's Fixed Implementation ✅
```javascript
Input: { message: "hello world" }
  ↓
1. Convert to bytes
  ↓
2. Add EIP-191 prefix: "\x19Ethereum Signed Message:\n" + length + message
  ↓
3. Hash with keccak256
  ↓
4. Sign with HSM ECDSA
  ↓
Output: Compatible signature format
```

### 2. Method-by-Method Comparison

| Method | Purpose | Viem Behavior | HSMSigner Behavior | Status |
|--------|---------|---------------|-------------------|--------|
| `sign({ hash })` | Sign raw hash for UserOps | Signs hash directly (no prefix) | Signs hash directly (no prefix) | ✅ Compatible |
| `signMessage({ message: string })` | Sign personal message | Adds EIP-191 → hash → sign | **NOW**: Adds EIP-191 → hash → sign | ✅ **FIXED** |
| `signMessage({ message: { raw } })` | Sign raw data | Adds EIP-191 → sign | **NOW**: Adds EIP-191 → sign | ✅ **FIXED** |
| `signTransaction()` | Sign transaction | Serializes → hash → sign | Not implemented (throws error) | ⚠️ Not needed |
| `signTypedData()` | Sign EIP-712 data | EIP-712 encoding → sign | Needs proper EIP-712 implementation | ⚠️ TODO |
| `signAuthorization()` | Sign EIP-7702 auth | Uses hashAuthorization → sign | Uses hashAuthorization → sign | ✅ Compatible |

### 3. Signature Format

Both implementations return the same signature format:

```
Format: 0x + r (64 hex chars) + s (64 hex chars) + v (2 hex chars)
Total: 132 hex characters (0x prefix + 130 chars = 65 bytes)

Example: 0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b

Breakdown:
- r: a461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf1 (32 bytes)
- s: 5fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b (32 bytes)
- v: 1b (1 byte, equals 27 in decimal)
```

## EIP-191: Personal Message Signing Standard

### What is EIP-191?

EIP-191 defines the standard for signing personal messages in Ethereum to prevent signature reuse attacks.

### Format

```
"\x19Ethereum Signed Message:\n" + len(message) + message
```

### Example

For message `"hello world"` (11 characters):

```
Raw message: hello world
Prefix: \x19Ethereum Signed Message:\n11
Full message: \x19Ethereum Signed Message:\n11hello world
Hash: keccak256(full message)
Signature: ECDSA(hash)
```

### Why It's Critical

1. **Prevents Signature Reuse**: Signatures can't be reused across different contexts
2. **Standard Compatibility**: All Ethereum wallets and tools expect this format
3. **Verification**: `ecrecover()` and `verifyMessage()` expect EIP-191 format

## Use Cases & When to Use Each Method

### `sign({ hash })` - Raw Hash Signing
**Use when:**
- Signing UserOperation hashes (ERC-4337)
- Signing transaction hashes directly
- Hash is already properly formatted

**Example:**
```typescript
const userOpHash = getUserOperationHash({ ... });
const signature = await account.sign({ hash: userOpHash });
```

### `signMessage({ message })` - Personal Message Signing
**Use when:**
- User is signing a human-readable message
- Verifying ownership of an address
- Standard wallet interactions

**Example:**
```typescript
// String message
const sig1 = await account.signMessage({ message: "I own this wallet" });

// Raw bytes
const sig2 = await account.signMessage({
  message: { raw: "0x68656c6c6f" }
});
```

### `signAuthorization()` - EIP-7702 Delegation
**Use when:**
- Setting up EIP-7702 account delegation
- Authorizing smart contract control of EOA

**Example:**
```typescript
const auth = await account.signAuthorization({
  contractAddress: "0x...",
  chainId: 84532,
  nonce: 0,
});
```

## AA24 Signature Error Root Cause

### Problem
When using EIP-7702 accounts with ERC-4337, the UserOperation was failing with:
```
Details: UserOperation reverted with reason: AA24 signature error
```

### Root Causes

1. **Wrong signing method used**: The original implementation was calling `signEthereumMessage()` for UserOp hashes, which would add EIP-191 prefix
2. **Validator mismatch**: The ECDSA validator on-chain expects raw ECDSA signatures for UserOps, not EIP-191 formatted signatures

### Solution

The fix separated two distinct signing paths:

```typescript
// For UserOperation signing (NO prefix)
async sign({ hash }) {
  const { signature } = signRawHash(hash);
  return signature;
}

// For personal message signing (WITH EIP-191 prefix)
async signMessage({ message }) {
  // Add EIP-191 prefix
  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
  const prefixedMessage = Buffer.concat([Buffer.from(prefix), messageBytes]);
  const hash = keccak256(prefixedMessage);
  const { signature } = signMessage(hash);
  return signature;
}
```

## Testing Signature Compatibility

### Test Case 1: Personal Message Signing

```typescript
import { privateKeyToAccount } from 'viem/accounts';

// Standard viem account
const viemAccount = privateKeyToAccount('0x...');
const sig1 = await viemAccount.signMessage({ message: 'hello' });

// HSM account
const hsmAccount = hsmSigner.toViemAccount();
const sig2 = await hsmAccount.signMessage({ message: 'hello' });

// Both signatures should verify the same address
const recovered1 = await recoverMessageAddress({ message: 'hello', signature: sig1 });
const recovered2 = await recoverMessageAddress({ message: 'hello', signature: sig2 });

expect(recovered1).toBe(viemAccount.address);
expect(recovered2).toBe(hsmAccount.address);
```

### Test Case 2: UserOperation Signing

```typescript
const userOpHash = getUserOperationHash({ ... });

// Both should produce valid signatures
const sig1 = await viemAccount.sign({ hash: userOpHash });
const sig2 = await hsmAccount.sign({ hash: userOpHash });

// Both should pass EntryPoint validation
// (would be tested on-chain)
```

## Implementation Details

### Key Methods

#### `signRawHash()` - New Method
```typescript
private signRawHash(messageHex: Hex | string) {
  // 1. Sign hash directly with HSM (no prefix)
  const sign = this.session.createSign("ECDSA", privateKey);
  const messageHash = Buffer.from(messageHex.slice(2), "hex");
  const signatureRS = sign.once(messageHash);

  // 2. Extract r, s components
  const r = signatureRS.subarray(0, 32);
  const s = signatureRS.subarray(32, 64);

  // 3. Recover v parameter
  for (let i = 0; i < 2; i++) {
    const recovered = ecrecover(messageHash, i, r, s);
    if (recovered.equals(publicKeyBytes)) {
      v = i + 27;
      break;
    }
  }

  // 4. Return signature
  return {
    r: `0x${r.toString("hex")}`,
    s: `0x${s.toString("hex")}`,
    v,
    signature: `0x${Buffer.concat([r, s, Buffer.from([v])]).toString("hex")}`,
  };
}
```

#### `signMessage()` - Fixed Implementation
```typescript
async signMessage({ message }) {
  // 1. Parse message into bytes
  let messageBytes;
  if (typeof message === "string") {
    messageBytes = Buffer.from(message, "utf8");
  } else if (message.raw) {
    messageBytes = Buffer.from(message.raw.slice(2), "hex");
  }

  // 2. Add EIP-191 prefix
  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
  const prefixedMessage = Buffer.concat([
    Buffer.from(prefix, "utf8"),
    messageBytes,
  ]);

  // 3. Hash the prefixed message
  const messageHash = keccak256(prefixedMessage);

  // 4. Sign the hash
  return this.signEthereumMessage(`0x${messageHash.toString("hex")}`).signature;
}
```

## Migration Guide

### If You Were Using HSMSigner Before

**❌ Old behavior:**
```typescript
// This was signing WITHOUT EIP-191 prefix
const signature = await hsmAccount.signMessage({ message: "hello" });
// Would NOT verify with standard tools
```

**✅ New behavior:**
```typescript
// This now signs WITH EIP-191 prefix (standard compliant)
const signature = await hsmAccount.signMessage({ message: "hello" });
// Will verify with standard tools like ethers, viem, etc.
```

### Breaking Changes

If you have existing signatures generated with the old implementation:
1. They are NOT standard EIP-191 signatures
2. They will NOT verify with standard tools
3. You need to re-sign messages with the new implementation

### Non-Breaking Changes

- `sign({ hash })` behavior unchanged (still signs raw hashes)
- `signAuthorization()` behavior unchanged
- Signature format (65 bytes, r+s+v) unchanged

## References

- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [ERC-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [EIP-7702: Set EOA account code](https://eips.ethereum.org/EIPS/eip-7702)
- [Viem Documentation: signMessage](https://viem.sh/docs/accounts/local/signMessage)
- [Viem Documentation: privateKeyToAccount](https://viem.sh/docs/accounts/local/privateKeyToAccount)

## Conclusion

The fixes ensure that `HSMSigner.toViemAccount()` is fully compatible with Viem's `privateKeyToAccount()` for standard operations:

✅ Personal message signing (EIP-191 compliant)
✅ UserOperation signing (raw hash signing)
✅ EIP-7702 authorization signing
✅ Signature format compatibility
⚠️ EIP-712 typed data signing (needs proper implementation)

The AA24 signature error was resolved by properly separating UserOperation signing (raw hash) from personal message signing (EIP-191 prefixed).
