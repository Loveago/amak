const express = require("express");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const upload = require("../middleware/upload");
const { uploadSingle } = require("../controllers/upload.controller");

const router = express.Router();

router.post("/single", authenticate, requireRole("ADMIN", "AGENT"), upload.single("file"), uploadSingle);

module.exports = router;
