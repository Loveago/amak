const { z } = require("zod");

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional()
});

const productSchema = z.object({
  name: z.string().min(2),
  size: z.string().min(1),
  categoryId: z.string().min(1),
  basePriceGhs: z.number().nonnegative().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

const planSchema = z.object({
  name: z.string().min(2),
  priceGhs: z.number().positive(),
  productLimit: z.number().int().positive(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

const walletAdjustmentSchema = z.object({
  agentId: z.string().min(1),
  amountGhs: z.number(),
  reason: z.string().min(2)
});

const withdrawalUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PAID"]) 
});

const userProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  slug: z.string().min(2).optional()
});

const userPasswordSchema = z.object({
  password: z.string().min(6)
});

const walletSetSchema = z.object({
  balanceGhs: z.number(),
  reason: z.string().min(2).optional()
});

const subscriptionSetSchema = z.object({
  planId: z.string().min(1)
});

const afaConfigSchema = z.object({
  registrationFeeGhs: z.number().positive()
});

const afaRegistrationStatusSchema = z.object({
  status: z.enum(["PENDING_PAYMENT", "SUBMITTED", "PROCESSING", "APPROVED", "REJECTED"])
});

module.exports = {
  categorySchema,
  productSchema,
  planSchema,
  walletAdjustmentSchema,
  withdrawalUpdateSchema,
  userProfileSchema,
  userPasswordSchema,
  walletSetSchema,
  subscriptionSetSchema,
  afaConfigSchema,
  afaRegistrationStatusSchema
};
