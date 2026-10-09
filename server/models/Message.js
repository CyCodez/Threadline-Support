const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    body: {
      type: String,
      required: [true, "Message cannot be empty"],
      trim: true,
      maxlength: 5000,
    },

    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
