const express = require("express");
const {
  getStorefront,
  createOrder,
  getReceipt,
  getReceiptByOrderId,
  lookupOrdersByPhone
} = require("../controllers/store.controller");

const router = express.Router();

router.get("/:slug", getStorefront);
router.post("/:slug/orders", createOrder);
router.get("/:slug/orders/status", lookupOrdersByPhone);
router.get("/:slug/orders/:orderId/receipt", getReceipt);
router.get("/orders/:orderId/receipt", getReceiptByOrderId);

module.exports = router;
