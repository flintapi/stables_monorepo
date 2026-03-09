
export function getAmountAfterFee(amount: number, feeConfig?: {activeFee: number}): number {
  const FEE_PERCENT = 0.001;
  const FEE_CAP = 200;
  const VAT_PERCENT = 0.075;
  const STAMP_DUTY = 50;

  if(feeConfig) {
    const {activeFee} = feeConfig;
    const fee = (amount * activeFee);
    const vat = fee > FEE_CAP? FEE_CAP * VAT_PERCENT : fee * VAT_PERCENT;
    if(amount > 10_000) {
      return fee > FEE_CAP ? (amount - (FEE_CAP + vat + STAMP_DUTY)) : (amount - (fee + vat + STAMP_DUTY));
    }
    else {
      return fee > FEE_CAP ? (amount - (FEE_CAP + vat)) : (amount - (fee + vat));
    }
  }

  const fee = (amount * FEE_PERCENT);
  const vat = fee > FEE_CAP? FEE_CAP * VAT_PERCENT : fee * VAT_PERCENT;
  if(amount > 10_000) {
    return fee > FEE_CAP ? (amount - (FEE_CAP + vat + STAMP_DUTY)) : (amount - (fee + vat + STAMP_DUTY));
  }
  else {
    return fee > FEE_CAP ? (amount - (FEE_CAP + vat)) : (amount - (fee + vat));
  }
}
