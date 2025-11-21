
export function getAmountAfterFee(amount: number): number {
  const FEE_PERCENT = 0.001
  const FEE_CAP = 200;

  const fee = (amount * FEE_PERCENT);
  return fee > FEE_CAP ? (amount - FEE_CAP) : (amount - fee);
}
