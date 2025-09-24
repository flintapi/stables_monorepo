import { describe, it, expect, afterEach, beforeEach } from "vitest"
import HSMSigner from "../hsm-signer"

import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk"
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants"
import { getKernelAddressFromECDSA, signerToEcdsaValidator, getValidatorAddress } from "@zerodev/ecdsa-validator"
import { createPublicClient, getContract, Hex, http, parseEther, parseGwei } from "viem"
import { baseSepolia } from "viem/chains"

describe("HSMSigner Test Suit", () => {

  let signer: HSMSigner;
  const keyLabel = "test-key-01";
  const HSM_OWNER = `0x6480d80d340d57ad82a7e79a91f0ecec3869d479` as Hex;
  const ZERODEV_RPC = 'https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/84532';

  beforeEach(() => {
    // initialize with keyLabel
    signer = new HSMSigner(keyLabel);
  })

  afterEach(() => {
    // Cleanup HSMSigner
    if(signer) {
      signer.cleanup()
    }
  })


  it.skip("should generate keypair from keyLabel and derive address", async () => {

    const address = signer?.deriveEthereumAddress(signer.keyPair.publicKey)

    console.log("Address for: ", keyLabel, " => ", address)

    expect(address).toContain('0x')

  })

  it("should initialise a kernel account with custom signer and sign a transaction", async () => {
    const entryPoint = getEntryPoint("0.7")
    const kernelVersion = KERNEL_V3_1;

    const publicClient = createPublicClient({
      transport: http(),
      chain: baseSepolia
    })

    const paymasterClient = createZeroDevPaymasterClient({
      chain: baseSepolia,
      // Get this RPC from ZeroDev dashboard
      transport: http(ZERODEV_RPC),
    })

    const hsmSigner = signer.toViemAccount();
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer: hsmSigner,
      kernelVersion,
      entryPoint
    })

    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator
      },
      entryPoint,
      kernelVersion,
    })

    const kernelClient = createKernelAccountClient({
      account,
      chain: baseSepolia,
      bundlerTransport: http(ZERODEV_RPC),
      client: publicClient,
      paymaster: {
        getPaymasterData: (userOperation) => {
          return paymasterClient.sponsorUserOperation({
            userOperation,
          })
        }
      }
    })

    console.log("Smart account address", kernelClient.account.address)
    console.log("HSM Owner address: ", hsmSigner.address)

    const hash = await kernelClient.sendTransaction({
      to: "0x1333946C8F7e30A74f6934645188bf75A13688Be" as Hex,
      value: parseEther('0.1'),
    })

    console.log("Transaction Hash: ", hash)

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash,
    })
    console.log("Actual transaction receipt", JSON.stringify(receipt, (key, value) => (typeof value === 'bigint')? value.toString() : value, 3))
    expect(hash).toContain('0x')
  }, {timeout: 100*100000})

  it.only("should generate smart accounts based on index, and get owner", async () => {
    const entryPoint = getEntryPoint("0.7")
    const kernelVersion = KERNEL_V3_1;

    const publicClient = createPublicClient({
      transport: http(),
      chain: baseSepolia
    })

    const paymasterClient = createZeroDevPaymasterClient({
      chain: baseSepolia,
      // Get this RPC from ZeroDev dashboard
      transport: http(ZERODEV_RPC),
    })

    const hsmSigner = signer.toViemAccount();
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer: hsmSigner,
      kernelVersion,
      entryPoint
    })

    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator
      },
      entryPoint,
      kernelVersion,
    })

    const newDerivedAccount = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator
      },
      entryPoint,
      kernelVersion,
      index: BigInt(1)
    })

    const kernelClient = createKernelAccountClient({
      account: newDerivedAccount,
      chain: baseSepolia,
      bundlerTransport: http(ZERODEV_RPC),
      client: publicClient,
      paymaster: {
        getPaymasterData: (userOperation) => {
          return paymasterClient.sponsorUserOperation({
            userOperation,
          })
        }
      }
    })

    console.log("Deployed Smart account address", kernelClient.account.address)

    const hash = await kernelClient.sendTransaction({
      to: "0x1333946C8F7e30A74f6934645188bf75A13688Be" as Hex,
      value: parseEther('0'),
    })

    console.log("Transaction Hash: ", hash)

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash,
    })
    console.log("Actual transaction receipt", JSON.stringify(receipt, (key, value) => (typeof value === 'bigint')? value.toString() : value, 3))

    const isDerivedDeployed = await newDerivedAccount.isDeployed()
    const isAccountDeployed = await account.isDeployed()

    const ecdsaValidatorContract = getContract({
      abi: [
        {
          type: "function",
          name: "ecdsaValidatorStorage",
          inputs: [{ name: "", type: "address", internalType: "address" }],
          outputs: [{ name: "owner", type: "address", internalType: "address" }],
          stateMutability: "view",
        },
      ],
      address: getValidatorAddress(entryPoint, kernelVersion),
      client: publicClient,
    })

    const owner = await ecdsaValidatorContract.read.ecdsaValidatorStorage([
      newDerivedAccount.address,
    ])

    console.log("HSM Owner address: ", owner)
    console.log("New Derived smart account: ", newDerivedAccount.address)

    expect(owner.toLowerCase()).toBe(HSM_OWNER.toLowerCase())
    expect(isDerivedDeployed).toBe(true)
    expect(isAccountDeployed).toBe(true)
    expect(hash).toContain('0x')
  }, {timeout: 100*1000000})

})
