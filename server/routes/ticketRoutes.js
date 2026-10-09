const express = require("express");

const {
  createTicket,
  getTicketScreenshot,
  getTicketActivity,
  getMyTickets,
  getQueue,
  getTicketById,
  updateTicket,
  assignTicket,
  getCustomerContext,
} = require("../controllers/ticketController");

const { protect, authorize } = require("../middleware/authMiddleware");

const { uploadScreenshot } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", uploadScreenshot.single("screenshot"), createTicket);

router.get("/mine", getMyTickets);

router.get("/queue", authorize("agent", "admin"), getQueue);

router.get(
  "/:id/customer-context",
  authorize("agent", "admin"),
  getCustomerContext,
);

router.get("/:id/screenshot", getTicketScreenshot);

router.get("/:id/activity", getTicketActivity);

router.patch("/:id/assign", authorize("agent", "admin"), assignTicket);

router.get("/:id", getTicketById);

router.patch("/:id", updateTicket);

module.exports = router;
