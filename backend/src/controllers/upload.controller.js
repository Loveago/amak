const env = require("../config/env");

function uploadSingle(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const host = req.get("host");
  const protocol = req.protocol;
  const baseUrl = env.baseUrl || `${protocol}://${host}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  return res.json({
    success: true,
    data: {
      filename: req.file.filename,
      url: fileUrl
    }
  });
}

module.exports = { uploadSingle };
