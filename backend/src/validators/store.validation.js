const { z } = require("zod");

const optionalTrimmed = (schema) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, schema.optional());

const createOrderSchema = z.object({
  customerName: optionalTrimmed(z.string().min(2)),
  customerPhone: optionalTrimmed(z.string().min(6)),
  recipientPhone: z.string().min(6),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
});

module.exports = { createOrderSchema };
