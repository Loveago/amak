const { z } = require("zod");

const initializeOrderPaymentSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().email()
});

const initializeSubscriptionSchema = z.object({
  planId: z.string().min(1),
  email: z.string().email()
});

const initializeAfaRegistrationSchema = z.object({
  fullName: z.string().min(2),
  ghanaCardNumber: z.string().min(4),
  dateOfBirth: z.string().min(4),
  occupation: z.string().min(2),
  notes: z.string().optional(),
  email: z.string().email()
});

module.exports = {
  initializeOrderPaymentSchema,
  initializeSubscriptionSchema,
  initializeAfaRegistrationSchema
};
