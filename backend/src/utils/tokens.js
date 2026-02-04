const jwt = require("jsonwebtoken");
const env = require("../config/env");

function issueTokens(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name
  };

  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

  return { accessToken, refreshToken };
}

module.exports = { issueTokens };
