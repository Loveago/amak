const prisma = require("../src/config/prisma");

const ADMIN_REFERRAL_CODE = "amaba11";

async function getAdminUser() {
  let admin = await prisma.user.findFirst({
    where: { slug: ADMIN_REFERRAL_CODE, role: "ADMIN" }
  });
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  }
  return admin;
}

async function backfillAdminReferrals() {
  const admin = await getAdminUser();
  if (!admin) {
    console.error("No admin user found.");
    return;
  }

  const products = await prisma.product.findMany({ select: { id: true } });
  if (!products.length) {
    console.log("No products found to assign.");
    return;
  }

  const referrals = await prisma.referral.findMany({
    where: { parentId: admin.id, level: 1 },
    select: { childId: true }
  });

  if (!referrals.length) {
    console.log("No admin-referred agents found.");
    return;
  }

  let updated = 0;
  for (const referral of referrals) {
    await prisma.agentProduct.createMany({
      data: products.map((product) => ({
        agentId: referral.childId,
        productId: product.id,
        markupGhs: 0,
        affiliateMarkupGhs: 0,
        isActive: true
      })),
      skipDuplicates: true
    });
    updated += 1;
  }

  console.log(`Backfilled bundles for ${updated} admin-referred agents.`);
}

backfillAdminReferrals()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
