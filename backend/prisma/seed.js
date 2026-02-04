const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@amabkinaata.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThis123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "AmaBaKinaata Admin",
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  const categories = [
    { name: "MTN", slug: "mtn" },
    { name: "Telecel", slug: "telecel" },
    { name: "AT Ishare", slug: "at-ishare" },
    { name: "AT Bigtime", slug: "at-bigtime" }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
  }

  const categoryRows = await prisma.category.findMany({
    where: { slug: { in: categories.map((item) => item.slug) } }
  });
  const categoryMap = categoryRows.reduce((acc, item) => {
    acc[item.slug] = item.id;
    return acc;
  }, {});

  const bundles = [
    {
      category: "mtn",
      items: [
        { size: "1GB", price: 4.5 },
        { size: "2GB", price: 9 },
        { size: "3GB", price: 13.5 },
        { size: "4GB", price: 18 },
        { size: "5GB", price: 22.5 },
        { size: "6GB", price: 30.5 },
        { size: "8GB", price: 36 },
        { size: "10GB", price: 42 },
        { size: "15GB", price: 62 },
        { size: "20GB", price: 81 },
        { size: "25GB", price: 100 },
        { size: "30GB", price: 119 },
        { size: "40GB", price: 157 },
        { size: "50GB", price: 195 },
        { size: "100GB", price: 385 }
      ]
    },
    {
      category: "telecel",
      items: [
        { size: "5GB", price: 23 },
        { size: "10GB", price: 40 },
        { size: "15GB", price: 60 },
        { size: "25GB", price: 95 },
        { size: "30GB", price: 126 },
        { size: "40GB", price: 150 },
        { size: "50GB", price: 185 },
        { size: "100GB", price: 360 }
      ]
    },
    {
      category: "at-bigtime",
      items: [
        { size: "30GB", price: 80 },
        { size: "40GB", price: 90 },
        { size: "50GB", price: 105 },
        { size: "100GB", price: 190 },
        { size: "200GB", price: 350 }
      ]
    },
    {
      category: "at-ishare",
      items: [
        { size: "1GB", price: 4.3 },
        { size: "2GB", price: 8.3 },
        { size: "3GB", price: 12.3, name: "3GB (Standard)" },
        { size: "3GB", price: 15, name: "3GB (Plus)" },
        { size: "4GB", price: 20 },
        { size: "5GB", price: 25 },
        { size: "6GB", price: 24 },
        { size: "7GB", price: 28 },
        { size: "8GB", price: 33 },
        { size: "10GB", price: 40 },
        { size: "15GB", price: 60 }
      ]
    }
  ];

  async function upsertProduct({ categoryId, name, size, basePriceGhs }) {
    const existing = await prisma.product.findFirst({
      where: { categoryId, name }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name, size, basePriceGhs, status: "ACTIVE" }
      });
      return;
    }

    await prisma.product.create({
      data: { name, size, basePriceGhs, status: "ACTIVE", categoryId }
    });
  }

  for (const bundle of bundles) {
    const categoryId = categoryMap[bundle.category];
    if (!categoryId) {
      continue;
    }
    for (const item of bundle.items) {
      await upsertProduct({
        categoryId,
        name: item.name || item.size,
        size: item.size,
        basePriceGhs: item.price
      });
    }
  }

  const plans = [
    { name: "Basic", priceGhs: 10, productLimit: 10 },
    { name: "Premium", priceGhs: 25, productLimit: 20 },
    { name: "Elite", priceGhs: 40, productLimit: 50 }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
