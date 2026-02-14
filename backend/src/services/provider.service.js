const prisma = require("../config/prisma");
const env = require("../config/env");

const ENCARTA_START_HOUR = 8;
const ENCARTA_START_MINUTE = 30;
const ENCARTA_END_HOUR = 18;
const ENCARTA_END_MINUTE = 0;

function getAccraTime() {
  const now = new Date();
  const accra = new Date(now.toLocaleString("en-US", { timeZone: env.providerTimezone }));
  return { hours: accra.getHours(), minutes: accra.getMinutes() };
}

function resolveProviderByTime() {
  const { hours, minutes } = getAccraTime();
  const currentMinutes = hours * 60 + minutes;
  const encartaStart = ENCARTA_START_HOUR * 60 + ENCARTA_START_MINUTE;
  const encartaEnd = ENCARTA_END_HOUR * 60 + ENCARTA_END_MINUTE;

  if (currentMinutes >= encartaStart && currentMinutes < encartaEnd) {
    return "ENCARTA";
  }
  return "GRANDAPI";
}

async function getProviderConfig() {
  try {
    const config = await prisma.providerConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", forceProvider: null }
    });
    return config;
  } catch (error) {
    return { id: "default", forceProvider: null };
  }
}

async function resolveActiveProvider() {
  const config = await getProviderConfig();

  if (config.forceProvider === "ENCARTA" || config.forceProvider === "GRANDAPI") {
    return { provider: config.forceProvider, reason: "admin_override" };
  }

  const provider = resolveProviderByTime();
  return { provider, reason: "time_schedule" };
}

async function setForceProvider(forceProvider) {
  const value = forceProvider === "ENCARTA" || forceProvider === "GRANDAPI" ? forceProvider : null;
  const config = await prisma.providerConfig.upsert({
    where: { id: "default" },
    update: { forceProvider: value },
    create: { id: "default", forceProvider: value }
  });
  return config;
}

module.exports = {
  resolveActiveProvider,
  resolveProviderByTime,
  getProviderConfig,
  setForceProvider
};
