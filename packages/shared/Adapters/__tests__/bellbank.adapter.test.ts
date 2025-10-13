import { describe, expect, it } from "vitest";

import BellBankAdapter from "../../Adapters/bellbank/bellbank.adapter";
import { createPublicClient, decodeFunctionData, formatUnits, http, parseAbi, parseAbiItem, parseEventLogs, parseTransaction, parseUnits } from "viem";
import { base } from "viem/chains";

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
      type: "individual",
      firstname: "John",
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

});
