const mongoose = require("mongoose");

const ticketActivitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "ticket-created",
        "screenshot-attached",
        "status-changed",
        "priority-changed",
        "assignment-changed",
        "reply-added",
        "internal-note",
      ],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

ticketActivitySchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("TicketActivity", ticketActivitySchema);
