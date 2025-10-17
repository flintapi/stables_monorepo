import type { Hex } from "viem";

import { getValidatorAddress, signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient, getUserOperationGasPrice } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1, KERNEL_V3_3, KernelVersionToAddressesMap } from "@zerodev/sdk/constants";
import { createPublicClient, createWalletClient, getContract, http, parseEther, zeroAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import HSMSigner from "../hsm-signer";

describe("hSMSigner Test Suit", () => {
  let signer: HSMSigner;
  const keyLabel = "test-key-01";
  const HSM_OWNER = `0x6480d80d340d57ad82a7e79a91f0ecec3869d479` as Hex;
  const ZERODEV_RPC = "https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/84532";

  beforeAll(() => {
    // initialize with keyLabel
    signer = new HSMSigner(keyLabel);
  });

  afterAll(() => {
    // Cleanup HSMSigner
    if (signer) {
      signer.cleanup();
    }
  });

  it("should generate keypair from keyLabel, derive address and sign a transaction", async () => {
    const address = signer?.deriveEthereumAddress(signer.keyPair.publicKey);

    console.log("Address for: ", keyLabel, " => ", address);

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account: signer.toViemAccount(),
      chain: baseSepolia,
      transport: http(),
    });

    const request = await walletClient.prepareTransactionRequest({
      to: address,
      value: parseEther("0"),
    });

    const signedHash = await walletClient.signTransaction(request);

    const hash = await walletClient.sendRawTransaction({
      serializedTransaction: signedHash,
    });

    const reciept = await publicClient.waitForTransactionReceipt({ hash });

    console.log("Receipt", reciept);

    expect(hash).toContain("0x");
    expect(address).toContain("0x");
  }, { timeout: 100 * 10000 });

  it("should initialise a kernel account with custom signer and sign a transaction", async () => {
    const entryPoint = getEntryPoint("0.7");
    const kernelVersion = KERNEL_V3_1;

    const publicClient = createPublicClient({
      transport: http(),
      chain: baseSepolia,
    });

    const paymasterClient = createZeroDevPaymasterClient({
      chain: baseSepolia,
      // Get this RPC from ZeroDev dashboard
      transport: http(ZERODEV_RPC),
    });

    const hsmSigner = signer.toViemAccount();
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer: hsmSigner,
      kernelVersion,
      entryPoint,
    });

    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
      },
      entryPoint,
      kernelVersion,
    });

    const kernelClient = createKernelAccountClient({
      account,
      chain: baseSepolia,
      bundlerTransport: http(ZERODEV_RPC),
      client: publicClient,
      paymaster: {
        getPaymasterData: (userOperation) => {
          return paymasterClient.sponsorUserOperation({
            userOperation,
          });
        },
      },
    });

    console.log("Smart account address", kernelClient.account.address);
    console.log("HSM Owner address: ", hsmSigner.address);

    const hash = await kernelClient.sendTransaction({
      to: "0x1333946C8F7e30A74f6934645188bf75A13688Be" as Hex,
      value: parseEther("0"),
    });

    console.log("Transaction Hash: ", hash);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });
    console.log("Actual transaction receipt", JSON.stringify(receipt, (key, value) => (typeof value === "bigint") ? value.toString() : value, 3));
    expect(hash).toContain("0x");
  }, { timeout: 100 * 100000 });

  it("should generate smart accounts based on index, and get owner", async () => {
    const entryPoint = getEntryPoint("0.7");
    const kernelVersion = KERNEL_V3_1;

    const publicClient = createPublicClient({
      transport: http(),
      chain: baseSepolia,
    });

    const paymasterClient = createZeroDevPaymasterClient({
      chain: baseSepolia,
      // Get this RPC from ZeroDev dashboard
      transport: http(ZERODEV_RPC),
    });

    const hsmSigner = signer.toViemAccount();
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer: hsmSigner,
      kernelVersion,
      entryPoint,
    });

    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
      },
      entryPoint,
      kernelVersion,
    });

    const newDerivedAccount = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
      },
      entryPoint,
      kernelVersion,
      index: BigInt(1),
    });

    const kernelClient = createKernelAccountClient({
      account: newDerivedAccount,
      chain: baseSepolia,
      bundlerTransport: http(ZERODEV_RPC),
      client: publicClient,
      paymaster: {
        getPaymasterData: (userOperation) => {
          return paymasterClient.sponsorUserOperation({
            userOperation,
          });
        },
      },
    });

    console.log("Deployed Smart account address", kernelClient.account.address);

    const hash = await kernelClient.sendTransaction({
      to: "0x1333946C8F7e30A74f6934645188bf75A13688Be" as Hex,
      value: parseEther("0"),
    });

    console.log("Transaction Hash: ", hash);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });
    console.log("Actual transaction receipt", JSON.stringify(receipt, (key, value) => (typeof value === "bigint") ? value.toString() : value, 3));

    const isDerivedDeployed = await newDerivedAccount.isDeployed();
    const isAccountDeployed = await account.isDeployed();

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
    });

    const owner = await ecdsaValidatorContract.read.ecdsaValidatorStorage([
      newDerivedAccount.address,
    ]);

    console.log("HSM Owner address: ", owner);
    console.log("New Derived smart account: ", newDerivedAccount.address);

    expect(owner.toLowerCase()).toBe(HSM_OWNER.toLowerCase());
    expect(isDerivedDeployed).toBe(true);
    expect(isAccountDeployed).toBe(true);
    expect(hash).toContain("0x");
  }, { timeout: 100 * 1000000 });

  it.only("should create a EIP7702 account from eoa", async () => {
    const entryPoint = getEntryPoint("0.7");
    const kernelVersion = KERNEL_V3_3;
    const kernelAddress = KernelVersionToAddressesMap[kernelVersion];

    console.log("Kernel version contract and address", kernelVersion, KERNEL_V3_3, kernelAddress);

    const publicClient = createPublicClient({
      transport: http(ZERODEV_RPC),
      chain: baseSepolia,
    });

    const paymasterClient = createZeroDevPaymasterClient({
      chain: baseSepolia,
      transport: http(ZERODEV_RPC),
    });

    // const eip7702Account = privateKeyToAccount(generatePrivateKey());
    const eip7702Account = signer.toViemAccount();

    const authorization = eip7702Account.signAuthorization && await eip7702Account.signAuthorization({
      contractAddress: kernelAddress.accountImplementationAddress,
      chainId: publicClient.chain.id,
      nonce: 1,
      // address: KERNEL_7702_DELEGATION_ADDRESS || eip7702Account.address as `0x${string}`
    });
    console.log("Authorization", authorization);
    console.log("Address", eip7702Account.address);

    const account = await createKernelAccount(publicClient, {
      eip7702Account,
      entryPoint,
      kernelVersion,
      plugins: {
        sudo: await signerToEcdsaValidator(publicClient, {
          signer: eip7702Account,
          kernelVersion,
          entryPoint,
        }),
      },
      eip7702Auth: authorization,
    });

    const kernelClient = createKernelAccountClient({
      account,
      chain: baseSepolia,
      bundlerTransport: http(ZERODEV_RPC),
      paymaster: paymasterClient,
      client: publicClient,
      userOperation: {
        estimateFeesPerGas: async ({ bundlerClient }) => {
          return getUserOperationGasPrice(bundlerClient);
        },
      },
    });

    const userOpHash = await kernelClient.sendTransaction({
      authorization,
      to: zeroAddress,
      value: BigInt(0),
      data: "0x",
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: userOpHash,
    });

    console.log("Transaction receupt: ", receipt);
    expect(userOpHash).toContain("0x");
  }, { timeout: 100 * 100000 });
});
