/**
 * This library provides a wrapper around communication with softhsm
 */

import * as graphene from "graphene-pk11"
import type { Session, Module } from "graphene-pk11";

import keccak256 from 'keccak';
import {
  ecrecover,
  fromRpcSig,
  keccak256 as etherKeccak,
} from 'ethereumjs-util';
import { toAccount } from "viem/accounts"
import type {Hex, Address, LocalAccount, HDAccount, SignAuthorizationReturnType} from 'viem'
import { hashAuthorization } from "viem/utils";


class HSMSigner {
  private session: Session;
  private hsmModule: Module;
  keyPair: graphene.IKeyPair;

  constructor(
    private keyLabel: string,
    private libPath: string = "/opt/homebrew/opt/softhsm/lib/softhsm/libsofthsm2.so", // local path
    private slotIndex: number = 0,
    private pin: string = process.env.HSM_PIN!,
  ) {
    this.hsmModule = graphene.Module.load(libPath, "SoftHSM2");
    this.hsmModule.initialize();

    const slots = this.hsmModule.getSlots();

    const slot = slots.items(slotIndex) // only slots with tokens present
    this.session = slot.open(graphene.SessionFlag.SERIAL_SESSION | graphene.SessionFlag.RW_SESSION);

    this.session.login(pin, graphene.UserType.USER);

    // get or generate Keypair for signer
    this.keyPair = this.getKeyPair(keyLabel);
  }

  /**
    * Creates a viem LocalAccount compatible with ZeroDev
  */
  toViemAccount(): LocalAccount | HDAccount {
    const address = this.deriveEthereumAddress(this.keyPair.publicKey)

    const signMessage = (message: Hex | string) => this.signEthereumMessage(message)

    return toAccount({
      address,
      async sign({hash}) {
        const { signature } = signMessage(hash)

        return signature
      },

      async signMessage({ message }) {
        let messageHash: Hex

        if (typeof message === 'string') {
          // Hash the message for ECDSA signing
          const messageBuffer = Buffer.from(message, 'utf8')
          const hash = keccak256('keccak256').update(messageBuffer).digest()
          messageHash = `0x${hash.toString('hex')}` as Hex
        } else {
          // Assume it's already a hash
          messageHash = message.raw as Hex;
        }

        const { signature } = signMessage(messageHash)

        // Return signature in the format expected by viem
        return signature;
        // return `0x${r.slice(2)}${s.slice(2)}${v.toString(16).padStart(2, '0')}` as Hex
      },

      async signTransaction(transaction) {
        // For transaction signing, we need to serialize and hash the transaction
        // This is handled by viem's transaction serialization
        throw new Error('Direct transaction signing not supported - use signMessage with transaction hash')
      },

      async signTypedData(typedData) {
        // Hash the typed data according to EIP-712
        const hash = keccak256('keccak256').update(JSON.stringify(typedData))
          .digest()
        const messageHash = `0x${hash.toString('hex')}` as Hex

        const { signature } = signMessage(messageHash)
        return signature;
        // return `0x${r.slice(2)}${s.slice(2)}${v.toString(16).padStart(2, '0')}` as Hex
      },

      async signAuthorization(params){
        const { chainId, nonce } = params;

        const address = params.address as Hex;
        const contractAddress = params.contractAddress || params.address as Hex;

        const hexMessage = hashAuthorization({
          contractAddress,
          chainId,
          nonce
        })

        const { r, s, v } = signMessage(hexMessage)

        const yParity = v === 27 ? 0 : 1;

        return {
          r,
          s,
          yParity,
          chainId,
          contractAddress,
          nonce,
          address,
        } as SignAuthorizationReturnType
      }
    })
  }


  getKeyPair(keyLabel: string, keyId: string = "01"): graphene.IKeyPair {
    // 1. Correctly find the key pair using a common ID
    let privateKeys = this.session.find({
      class: graphene.ObjectClass.PRIVATE_KEY,
      keyType: graphene.KeyType.EC,
      id: Buffer.from(keyId),
      label: keyLabel
    });

    if (privateKeys.length > 0) {
      console.log("Found exisiting keys... length: ", privateKeys.length);

      const privateKey = privateKeys.items(0);
      // Find the public key with the same ID
      const publicKey = this.session.find({
        class: graphene.ObjectClass.PUBLIC_KEY,
        keyType: graphene.KeyType.EC,
        id: Buffer.from(keyId),
        label: keyLabel
      }).items(0);

      return {
        privateKey,
        publicKey
      } as graphene.IKeyPair;
    }

    // generate ECDSA key pair
    console.log("generating new keypair")
    var keys = this.session.generateKeyPair(graphene.KeyGenMechanism.EC, {
      class: graphene.ObjectClass.PUBLIC_KEY,
      keyType: graphene.KeyType.EC,
      id: Buffer.from(keyId),
      label: keyLabel,
      token: true,
      verify: true,
      derive: true,
      paramsEC: graphene.NamedCurve.getByName("secp256k1").value,
    }, {
      class: graphene.ObjectClass.PRIVATE_KEY,
      keyType: graphene.KeyType.EC,
      id: Buffer.from(keyId),
      label: keyLabel,
      token: true,
      sign: true,
      derive: true,
    });

    return keys;
  }

  // TODO: implement methods to generate, encrypt and store and retrieve mnemonic

  deriveEthereumAddress(publicKey: graphene.PublicKey): Address {
    // 1. Extract EC point from HSM
    const ecPoint = publicKey.getAttribute({ pointEC: null }).pointEC

    // 2. Decode ASN.1 OCTET STRING
    const rawPoint = this.decodeEcPoint(ecPoint); // [0x04 || X || Y]

    if (rawPoint[0] !== 0x04) {
      throw new Error("Only uncompressed EC points are supported");
    }

    // 3. Drop 0x04 prefix and get the 64-byte public key
    const keyBytes = rawPoint.slice(1);

    // 4. Console log the public key in hex format
    console.log("Public Key (uncompressed): 0x" + keyBytes.toString("hex"));

    // 5. Hash with Keccak-256
    const hash = keccak256('keccak256').update(keyBytes).digest();

    // 6. Last 20 bytes → Ethereum address
    return "0x" + hash.slice(-20).toString("hex") as Address;
  }

  private decodeEcPoint(ecPointBuffer: Buffer | any) {
    if (ecPointBuffer[0] !== 0x04) throw new Error("Expected OCTET STRING");
    const len = ecPointBuffer[1];
    return ecPointBuffer.slice(2, 2 + len);
  }


  /**
   * Signs an Ethereum personal message using a PKCS#11 private key
   * and returns the signature in the Ethereum (r, s, v) format.
   *
   * @param {graphene.Session} session The PKCS#11 session.
   * @param {graphene.NativeKey} privateKey The PKCS#11 private key object for signing.
   * @param {graphene.NativeKey} publicKey The PKCS#11 public key object associated with the private key.
   * @param {string} message The message to be signed.
   * @returns {object} An object containing the r, s, v components and the full 0x-prefixed signature.
   */
  private signEthereumMessage(messageHex: Hex | string) {
    const privateKey: graphene.PrivateKey = this.keyPair.privateKey;
    const publicKey: graphene.PublicKey = this.keyPair.publicKey;
    // 1. Create the Ethereum personal message format
    // const personalMessage = `\x19Ethereum Signed Message:\n${message.length}${message}`;

    // 2. Hash the personal message using Keccak-256
    // const messageHash = keccak256('keccak256').update(Buffer.from(personalMessage, 'utf8')).digest();

    // 3. Sign the message hash using the HSM
    // Ensure the mechanism is 'ECDSA' for raw secp256k1 signatures
    const sign = this.session.createSign("ECDSA", privateKey);

    const messageHash = Buffer.from(messageHex.slice(2), 'hex');
    const signatureRS = sign.once(messageHash); // signatureRS will be a Buffer (r || s)
    // keccak256Hash(Buffer.from(rlpUnsigned.slice(2), 'hex'))

    // 4. Extract r and s components (each 32 bytes for secp256k1)
    const r = signatureRS.subarray(0, 32);
    const s = signatureRS.subarray(32, 64);

    // 5. Get the raw uncompressed public key bytes from the HSM's publicKey object
    const ecPoint = publicKey.getAttribute({ pointEC: null }).pointEC; // [0x04 || X || Y]
    const rawPoint = this.decodeEcPoint(ecPoint); // [0x04 || X || Y]
    if (rawPoint[0] !== 0x04) {
      throw new Error("Only uncompressed EC points are supported from the HSM public key.");
    }
    const rawPublicKeyBytes = rawPoint.slice(1); // X || Y (64 bytes)

    let v; // Recovery ID
    let recoveredPub;

    // 6. Determine the v (recovery ID) value
    // Iterate through possible v values (0 and 1, which map to 27 and 28)
    for (let i = 0; i < 2; i++) {
      try {
        // ethUtil.ecrecover expects the message hash, v, r, and s
        // The v value in ecrecover is 0 or 1, which internally gets converted to 27 or 28.
        recoveredPub = ecrecover(messageHash, i, r, s);
        // Compare the recovered public key with the actual public key from the HSM
        if (recoveredPub.toString('hex') === rawPublicKeyBytes.toString('hex')) {
          // console.log("recoveredPub == > ", recoveredPub)
          // console.log("rawPublicKeyBytes == > ", rawPublicKeyBytes.toString('hex'))

          v = i + 27; // Ethereum's v values are typically 27 or 28

          break;
        }
      } catch (e: any) {
        // Handle potential errors during recovery (e.g., invalid signature components)
        console.warn(`Attempted recovery with v_candidate=${i} failed: ${e.message}`);
      }
    }

    if (v === undefined) {
      throw new Error("Could not determine the correct recovery ID (v) for the signature.");
    }

    // 7. Format the output as an Ethereum signature
    // The final signature is r (32 bytes) + s (32 bytes) + v (1 byte)
    // s must be padded to 64 hex characters (32 bytes)
    const finalSignatureBuffer = Buffer.concat([r, s, Buffer.from([v])]);
    const fullEthSignature = '0x' + finalSignatureBuffer.toString('hex') as Hex;

    // console.log("Ethereum Signature (r, s, v components):", {
    //   r: '0x' + r.toString('hex'),
    //   s: '0x' + s.toString('hex'),
    //   v: v
    // });
    // console.log("Full Ethereum Signature String:", fullEthSignature);

    return {
      r: '0x' + r.toString('hex'),
      s: '0x' + s.toString('hex'),
      v: v,
      signature: fullEthSignature // This is the full 65-byte R, S, V signature as a hex string
    };
  }

  // Verify Ethereum signature

  verifyEthereumSignature(message: Hex, signature: Hex, expectedAddress: Address) {
    try {
      // Create the Ethereum personal message format
      const personalMessage = `\x19Ethereum Signed Message:\n${message.length}${message}`;

      // Hash the personal message
      const messageHash = keccak256('keccak256').update(Buffer.from(personalMessage, 'utf8')).digest();

      // Parse the signature string into r, s, and v
      const sig = fromRpcSig(signature);

      // Recover public key
      const publicKey = ecrecover(messageHash, sig.v, sig.r, sig.s);

      // Derive address
      const recoveredAddress = '0x' + etherKeccak(publicKey).toString('hex').slice(-40);


      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // --------------------------
  // Transaction signing helpers
  // --------------------------

  private toBufferFromHexOrNumber(value: any) {
    if (value === undefined || value === null) return Buffer.alloc(0);
    if (typeof value === 'string') {
      const hex = value.startsWith('0x') ? value.slice(2) : value;
      if (hex.length === 0) return Buffer.alloc(0);
      const buf = Buffer.from(hex.length % 2 === 0 ? hex : '0' + hex, 'hex');
      // strip leading zero bytes for RLP minimal encoding; zero => empty buffer
      let i = 0;
      while (i < buf.length && buf[i] === 0) i++;
      return i === buf.length ? Buffer.alloc(0) : buf.subarray(i);
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      let bn = BigInt(value);
      if (bn === 0n) return Buffer.alloc(0);
      const bytes = [];
      while (bn > 0n) {
        bytes.push(Number(bn & 0xffn));
        bn >>= 8n;
      }
      return Buffer.from(bytes.reverse());
    }
    if (Buffer.isBuffer(value)) return value;
    throw new Error('Unsupported value type for buffer conversion');
  }


  private keccak256Hash(buf: string | Buffer) {
    return keccak256('keccak256').update(buf).digest();
  }


  cleanup() {
    if(this.session) {
      this.session?.logout();
      this.session?.close();
    }
    this.hsmModule.finalize();
  }
}


export default HSMSigner
