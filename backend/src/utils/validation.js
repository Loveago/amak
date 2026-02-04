function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const details = result.error.issues.map((issue) => issue.message).join(", ");
    const error = new Error(details);
    error.statusCode = 400;
    throw error;
  }
  return result.data;
}

module.exports = { validate };
