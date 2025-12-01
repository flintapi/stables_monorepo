import { describe, expect, it } from "vitest"
import DecimalFormat from "decimal-format"
import { getAmountAfterFee } from "@flintapi/shared/Utils";

describe("Number format Test Suite", () => {

  it("should round to the nearest integer when sometimes", async () => {
    const df = new DecimalFormat('###0.#'); // remove coma for workable number formats
    const transactionAmount = df.format(getAmountAfterFee(1001.001001))

    console.log("Amount", transactionAmount)
    expect(Number(transactionAmount)).toBe(1000)
  })

  it("should not round properly", () => {
    const transactionAmount = getAmountAfterFee(1001.001001)
    console.log(transactionAmount)
    expect(transactionAmount).toBeLessThan(1000)
  })
})
