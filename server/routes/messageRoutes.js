const express = require("express");
const {
  getMessages,
  createMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/tickets/:id/messages", getMessages);
router.post("/tickets/:id/messages", createMessage);

module.exports = router;
