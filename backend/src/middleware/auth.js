const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../config/prisma");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Missing token" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false, error: "Account inactive" });
    }
    req.user = {
      id: user.id,
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

module.exports = authenticate;
