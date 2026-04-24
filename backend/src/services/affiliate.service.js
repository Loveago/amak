const prisma = require("../config/prisma");
const { COMMISSION_RATES } = require("../config/affiliate");
const { creditWallet } = require("./wallet.service");

async function creditAffiliateCommissions({ agentId, orderId, orderTotalGhs }) {
  const total = Number(orderTotalGhs);
  if (!Number.isFinite(total) || total <= 0) {
    return;
  }

  const referrals = await prisma.referral.findMany({
    where: { childId: agentId },
    orderBy: { level: "asc" }
  });

  for (const referral of referrals) {
    if (!referral?.parentId || referral.parentId === agentId) {
      continue;
    }

    const rate = COMMISSION_RATES[referral.level];
    if (!rate) {
      continue;
    }

    const existingCommission = await prisma.walletTransaction.findFirst({
      where: {
        wallet: { agentId: referral.parentId },
        type: "COMMISSION",
        reference: orderId
      }
    });
    if (existingCommission) {
      continue;
    }

    const amount = total * rate;
    await creditWallet({
      agentId: referral.parentId,
      amountGhs: amount,
      type: "COMMISSION",
      reference: orderId,
      metadata: { level: referral.level, sourceAgentId: agentId }
    });
  }
}

module.exports = { creditAffiliateCommissions };
