const { z } = require("zod");

const activateProductSchema = z.object({
  markupGhs: z.number().min(0).optional(),
  isActive: z.boolean().optional()
});

const affiliatePricingSchema = z.object({
  affiliateMarkupGhs: z.number().min(0)
});

const withdrawalSchema = z.object({
  amountGhs: z.number().positive(),
  momoNetwork: z.string().min(2),
  momoNumber: z.string().min(6)
});

module.exports = { activateProductSchema, affiliatePricingSchema, withdrawalSchema };
