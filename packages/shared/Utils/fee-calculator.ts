
export function getAmountAfterFee(amount: number, feeConfig?: {activeFee: number}): number {
  const FEE_PERCENT = 0.001
  const FEE_CAP = 200;

  if(feeConfig) {
    const {activeFee} = feeConfig;
    const fee = (amount * activeFee);
    return (amount - fee);
  }

  const fee = (amount * FEE_PERCENT);
  return fee > FEE_CAP ? (amount - FEE_CAP) : (amount - fee);
}
