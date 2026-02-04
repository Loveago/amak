function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, error: "Route not found" });
}

function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ success: false, error: err.message || "Server error" });
}

module.exports = { notFoundHandler, errorHandler };
