const prisma = require("../config/prisma");
const { COMMISSION_RATES } = require("../config/affiliate");
const { creditWallet } = require("./wallet.service");

async function creditAffiliateCommissions({ agentId, orderId, orderTotalGhs }) {
  const referrals = await prisma.referral.findMany({
    where: { childId: agentId },
    orderBy: { level: "asc" }
  });

  for (const referral of referrals) {
    const rate = COMMISSION_RATES[referral.level];
    if (!rate) {
      continue;
    }
    const amount = Number(orderTotalGhs) * rate;
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
