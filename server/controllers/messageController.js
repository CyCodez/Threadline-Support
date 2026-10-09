const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const Message = require("../models/Message");
const TicketActivity = require("../models/TicketActivity");

const getTicketForAccess = async (ticketId, user) => {
  if (!mongoose.isValidObjectId(ticketId)) return null;

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) return null;

  const staff = ["agent", "admin"].includes(user.role);
  const owner = ticket.customer.toString() === user._id.toString();

  if (!staff && !owner) {
    const error = new Error("You do not have permission to access this conversation.");
    error.statusCode = 403;
    throw error;
  }

  return ticket;
};

const getMessages = async (req, res) => {
  await getTicketForAccess(req.params.id, req.user);

  const staff = ["agent", "admin"].includes(req.user.role);

  const filter = {
    ticket: req.params.id,
    ...(staff ? {} : { isInternal: false }),
  };

  const messages = await Message.find(filter)
    .populate("sender", "name email role avatar")
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    messages,
  });
};

const createMessage = async (req, res) => {
  const ticket = await getTicketForAccess(req.params.id, req.user);

  const { body, isInternal = false } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message cannot be empty.",
    });
  }

  if (isInternal && !["agent", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only support staff can add internal notes.",
    });
  }

  const previousStatus = ticket.status;

  const message = await Message.create({
    ticket: ticket._id,
    sender: req.user._id,
    body: body.trim(),
    isInternal: Boolean(isInternal),
  });

  if (!isInternal) {
    if (["resolved", "closed"].includes(ticket.status)) {
      ticket.status = "open";
    } else if (req.user.role === "customer") {
      ticket.status = "open";
    } else {
      ticket.status = "in-progress";
    }

    await ticket.save();
  }

  await TicketActivity.create({
    ticket: ticket._id,
    actor: req.user._id,
    type: isInternal ? "internal-note" : "reply-added",
    message: isInternal
      ? "Internal note added"
      : `${req.user.role === "customer" ? "Customer" : "Support"} replied`,
    isInternal: Boolean(isInternal),
    metadata: {
      messageId: message._id,
      senderRole: req.user.role,
    },
  });

  if (!isInternal && previousStatus !== ticket.status) {
    await TicketActivity.create({
      ticket: ticket._id,
      actor: req.user._id,
      type: "status-changed",
      message: `Status changed from ${previousStatus.replaceAll("-", " ")} to ${ticket.status.replaceAll("-", " ")}`,
      metadata: {
        from: previousStatus,
        to: ticket.status,
        causedBy: "reply",
      },
    });
  }

  const result = await Message.findById(message._id)
    .populate("sender", "name email role avatar");

  res.status(201).json({
    success: true,
    message: result,
  });
};

module.exports = {
  getMessages,
  createMessage,
};
