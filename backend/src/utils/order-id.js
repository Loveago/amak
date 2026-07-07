const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomAlphanumeric(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

function formatDateTag(date = new Date()) {
  const month = date
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${day}${year}`;
}

function generateOrderId(prefix) {
  return `${prefix}-${formatDateTag()}-${randomAlphanumeric(6)}`;
}

module.exports = { generateOrderId };
