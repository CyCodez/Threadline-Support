const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: [
        "account",
        "gallery",
        "client-access",
        "selection",
        "payments",
        "bookings",
        "subscription",
        "technical",
        "other",
      ],
      default: "other",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "open",
        "in-progress",
        "waiting-on-customer",
        "resolved",
        "closed",
      ],
      default: "open",
      index: true,
    },

    expectedResult: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    actualResult: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    stepsTaken: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    screenshot: {
      storageName: {
        type: String,
        default: "",
      },

      originalName: {
        type: String,
        default: "",
      },

      mimeType: {
        type: String,
        default: "",
      },

      size: {
        type: Number,
        default: 0,
      },

      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

ticketSchema.index({
  customer: 1,
  updatedAt: -1,
});

ticketSchema.index({
  assignedTo: 1,
  status: 1,
  priority: -1,
});

ticketSchema.index({
  status: 1,
  priority: -1,
  updatedAt: -1,
});

module.exports = mongoose.model("Ticket", ticketSchema);
