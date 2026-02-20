const crypto = require("crypto");
const prisma = require("../config/prisma");

const extractKey = (req) => {
  const header = req.headers.authorization || req.headers["x-api-key"] || "";
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^api-key\s+/i.test(trimmed)) {
    return trimmed.replace(/^api-key\s+/i, "").trim();
  }
  if (/^apikey\s+/i.test(trimmed)) {
    return trimmed.replace(/^apikey\s+/i, "").trim();
  }
  if (/^bearer\s+/i.test(trimmed)) {
    return trimmed.replace(/^bearer\s+/i, "").trim();
  }
  return trimmed;
};

const hashKey = (value) => crypto.createHash("sha256").update(value).digest("hex");

async function authenticateApiKey(req, res, next) {
  try {
    const rawKey = extractKey(req);
    if (!rawKey) {
      return res.status(401).json({ success: false, error: "Missing API key" });
    }

    const keyHash = hashKey(rawKey);
    const record = await prisma.agentApiKey.findUnique({
      where: { keyHash },
      include: { agent: true }
    });
    if (!record || !record.agent || record.agent.status !== "ACTIVE") {
      return res.status(401).json({ success: false, error: "Invalid API key" });
    }

    const access = await prisma.apiAccessRequest.findUnique({ where: { agentId: record.agentId } });
    if (!access || access.status !== "APPROVED") {
      return res.status(403).json({ success: false, error: "API access not approved" });
    }

    req.apiAgent = { id: record.agentId, keyId: record.id };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticateApiKey, hashKey };
