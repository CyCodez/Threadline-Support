const express = require("express");
const { overview } = require("../controllers/adminController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", protect, authorize("admin"), overview);

module.exports = router;
