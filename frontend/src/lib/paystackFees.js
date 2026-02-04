export const PAYSTACK_FEE_CONFIG = {
  percentage: 0.0195
};

export function computePaystackFee(amountGhs = 0) {
  const amount = Number(amountGhs) || 0;
  if (amount <= 0) return 0;
  return amount * PAYSTACK_FEE_CONFIG.percentage;
}

export function computePaystackGross(amountGhs = 0) {
  const amount = Number(amountGhs) || 0;
  const fee = computePaystackFee(amount);
  return {
    fee,
    gross: amount + fee
  };
}
