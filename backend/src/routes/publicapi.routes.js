const express = require("express");
const { authenticateApiKey } = require("../middleware/api-key");
const { listPackages, getBalance, placeOrder, getOrderStatus } = require("../controllers/publicapi.controller");

const router = express.Router();

router.use(authenticateApiKey);

router.get("/packages", listPackages);
router.get("/balance", getBalance);
router.post("/orders", placeOrder);
router.get("/orders/:orderId", getOrderStatus);

module.exports = router;
