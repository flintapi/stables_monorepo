import { describe, expect, it } from "vitest";

import BellBankAdapter from "../bellbank.adapter";
import { createPublicClient, decodeFunctionData, formatUnits, http, parseAbi, parseAbiItem, parseEventLogs, parseTransaction, parseUnits } from "viem";
import { base } from "viem/chains";
import env from "@/env";

describe("bellbak Adapter Test Suit", () => {
  const adapter = new BellBankAdapter();
  const externalAccountRef = "25080408480210354632";
  const accountNumber = "01109728837489";
  const accountName = "Flintapi - James Deon";

  it.skip("should get bank list", async () => {
    const banks = await adapter.listBanks();
    const getBellCode = banks.find(bank => bank.institutionName.toLowerCase().includes("gtbank"));
    console.log("Bell bank object", getBellCode);
    expect(banks).toBeInstanceOf(Array);
    expect(banks.length).toBeGreaterThan(0);
  });

  it.skip("should create a virtual account", async () => {
    const account = await adapter.createVirtualAccount({
      firstname: "Jophn",
      lastname: "Donelly",
      phoneNumber: "+2349071146128",
      address: "123 Main St",
      bvn: "12345678911",
      gender: "male",
      dateOfBirth: "1997/05/29",
    });
    console.log("Virtual account", account);
    expect(account).toBeInstanceOf(Object);
    expect(account.id).toBeDefined();
  });

  it.skip("should check account number name enquiry", async () => {
    const enquiry = await adapter.nameEnquiry({
      bankCode: "010",
      accountNumber: "1001011000",
    });

    expect(enquiry.accountNumber).toBe("1001011000");
    expect(enquiry.bank).toBe("Bell Bank MFB");

    console.log("Name enquiry", enquiry);
  }, { timeout: 10000 * 100 });

  it.skip("should transfer to test account", async () => {
    const reference = crypto.randomUUID();
    console.log("Reference", reference);

    const transfer = await adapter.transfer({
      beneficiaryBankCode: "010",
      beneficiaryAccountNumber: "1001011000",
      amount: 100000,
      narration: "Test transfer",
      reference,
      senderName: "YoSwap",
    });

    console.log("Transfer response", transfer);
    expect(transfer).toBeInstanceOf(Object);
    expect(transfer.status).toBeDefined();
    expect(transfer.status).toBe("pending");
  }, { timeout: 10000 * 100 });

  it.skip("should query transaction status and details", async () => {
    const details = await adapter.queryTransaction({ reference: "eabfdea1-7bc3-4504-a188-26e691b4b3ab" });
    console.log("Query details", details);

    expect(details.id).toBeDefined();
    expect(details.status).toBeDefined();
  }, { timeout: 10000 * 100 });

  it.skip("should get transaction for merchant", async () => {
    const transactions = await adapter.transactions();
    console.log("Transactions", transactions);
  }, { timeout: 10000 * 100 });


  it.only("should decode transaction hash", async () => {
    const client = createPublicClient({
      transport: http(),
      chain: base,
    });

    const transferEventAbi = parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    )
    const tokenAddress = `0x46C85152bFe9f96829aA94755D9f915F9B10EF5F`
    const transaction = await client.waitForTransactionReceipt({ hash: `0x165e9a731ea787fcd7e55ca89beb05877597ec8a07dafad22dd23733b7875335` as `0x${string}`, confirmations: 64, timeout: 10000*10 })
    console.log("TO account", transaction.to)
    const transferLogs = transaction.logs.filter(log => log.address.toLowerCase() === tokenAddress.toLowerCase())

    const transfers = []

    for (const log of transferLogs) {
      try {
        const decodedLog = parseEventLogs({
          abi: [transferEventAbi],
          logs: [log]
        })[0]

        if (decodedLog.eventName === 'Transfer' && decodedLog.args.to.toLowerCase() === env.COLLECTION_ADDRESS?.toLowerCase()) {
          transfers.push({
            from: decodedLog.args.from,
            to: decodedLog.args.to,
            value: formatUnits(decodedLog.args.value, 6), // This is the amount in wei/smallest unit
            tokenAddress: log.address
          })
        }
      } catch (parseError) {
        console.warn('Failed to parse log:', parseError)
        continue
      }
    }

    console.log('Transfers', transfers)
  }, {timeout: 10000*100})
});
