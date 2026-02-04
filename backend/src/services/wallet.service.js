const prisma = require("../config/prisma");

async function creditWallet({ agentId, amountGhs, type, reference, metadata }) {
  if (!amountGhs || amountGhs <= 0) {
    return null;
  }

  return prisma.wallet.upsert({
    where: { agentId },
    update: {
      balanceGhs: { increment: amountGhs },
      transactions: {
        create: {
          type,
          amountGhs,
          reference,
          metadata
        }
      }
    },
    create: {
      agentId,
      balanceGhs: amountGhs,
      transactions: {
        create: {
          type,
          amountGhs,
          reference,
          metadata
        }
      }
    }
  });
}

async function debitWallet({ agentId, amountGhs, type, reference, metadata }) {
  if (!amountGhs || amountGhs <= 0) {
    return null;
  }

  return prisma.wallet.update({
    where: { agentId },
    data: {
      balanceGhs: { decrement: amountGhs },
      transactions: {
        create: {
          type,
          amountGhs: -Math.abs(amountGhs),
          reference,
          metadata
        }
      }
    }
  });
}

module.exports = { creditWallet, debitWallet };
