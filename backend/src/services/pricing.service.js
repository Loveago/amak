const prisma = require("../config/prisma");

async function getAncestorIds(agentId) {
  const ancestors = [];
  const visited = new Set([agentId]);
  let currentId = agentId;

  while (true) {
    const referral = await prisma.referral.findFirst({
      where: { childId: currentId, level: 1 }
    });
    if (!referral) {
      break;
    }
    if (visited.has(referral.parentId)) {
      break;
    }
    ancestors.push(referral.parentId);
    visited.add(referral.parentId);
    currentId = referral.parentId;
  }

  return ancestors;
}

async function getAncestorAffiliateMarkupMap(agentId, productIds) {
  if (!productIds.length) {
    return new Map();
  }
  const ancestorIds = await getAncestorIds(agentId);
  if (!ancestorIds.length) {
    return new Map();
  }

  const ancestorProducts = await prisma.agentProduct.findMany({
    where: {
      agentId: { in: ancestorIds },
      productId: { in: productIds }
    },
    select: { productId: true, affiliateMarkupGhs: true }
  });

  const markupMap = new Map();
  ancestorProducts.forEach((entry) => {
    const current = markupMap.get(entry.productId) || 0;
    markupMap.set(entry.productId, current + Number(entry.affiliateMarkupGhs || 0));
  });

  return markupMap;
}

function getEffectiveBasePrice({ basePriceGhs, affiliateMarkupMap, productId }) {
  if (basePriceGhs === null || basePriceGhs === undefined) {
    return null;
  }
  const affiliateMarkup = affiliateMarkupMap.get(productId) || 0;
  return Number(basePriceGhs) + Number(affiliateMarkup || 0);
}

module.exports = { getAncestorAffiliateMarkupMap, getEffectiveBasePrice };
