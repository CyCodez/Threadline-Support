const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const TicketActivity = require("../models/TicketActivity");
const fs = require("fs/promises");
const path = require("path");

const ticketView = (query) =>
  query
    .populate("customer", "name email role avatar")
    .populate("assignedTo", "name email role avatar");

const recordActivity = async ({
  ticket,
  actor,
  type,
  message,
  metadata = {},
  isInternal = false,
}) => {
  return TicketActivity.create({
    ticket: ticket._id,
    actor: actor?._id || actor || null,
    type,
    message,
    metadata,
    isInternal,
  });
};

const canViewTicket = (ticket, user) => {
  if (["agent", "admin"].includes(user.role)) {
    return true;
  }

  return ticket.customer._id.toString() === user._id.toString();
};

const createTicket = async (req, res) => {
  const {
    subject,
    description,
    category,
    priority,
    expectedResult,
    actualResult,
    stepsTaken,
  } = req.body;

  if (!subject || !description) {
    return res.status(400).json({
      success: false,
      message: "Subject and description are required.",
    });
  }

  let ticket;

  try {
    ticket = await Ticket.create({
      customer: req.user._id,

      subject,
      description,
      category,
      priority,
      expectedResult,
      actualResult,
      stepsTaken,

      screenshot: req.file
        ? {
            storageName: req.file.filename,

            originalName: req.file.originalname,

            mimeType: req.file.mimetype,

            size: req.file.size,

            uploadedAt: new Date(),
          }
        : undefined,
    });
  } catch (error) {
    if (req.file) {
      await fs
        .unlink(
          path.join(
            __dirname,
            "..",
            "uploads",
            "screenshots",
            req.file.filename,
          ),
        )
        .catch(() => {});
    }

    throw error;
  }

  await recordActivity({
    ticket,
    actor: req.user,
    type: "ticket-created",
    message: "Conversation started",
    metadata: { subject: ticket.subject },
  });

  if (req.file) {
    await recordActivity({
      ticket,
      actor: req.user,
      type: "screenshot-attached",
      message: "Screenshot attached",
      metadata: {
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  }

  const result = await ticketView(Ticket.findById(ticket._id));

  res.status(201).json({
    success: true,
    ticket: result,
  });
};

const getTicketScreenshot = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket ID.",
    });
  }

  const ticket = await Ticket.findById(req.params.id).select(
    "customer screenshot",
  );

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support request not found.",
    });
  }

  const canView =
    ["agent", "admin"].includes(req.user.role) ||
    ticket.customer.toString() === req.user._id.toString();

  if (!canView) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to view this screenshot.",
    });
  }

  if (!ticket.screenshot?.storageName) {
    return res.status(404).json({
      success: false,
      message: "This support request has no screenshot.",
    });
  }

  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    "screenshots",
    path.basename(ticket.screenshot.storageName),
  );

  return res.sendFile(
    filePath,
    {
      headers: {
        "Cache-Control": "private, max-age=300",

        "Content-Disposition": `inline; filename="${encodeURIComponent(
          ticket.screenshot.originalName || "screenshot",
        )}"`,
      },
    },
    (error) => {
      if (error && !res.headersSent) {
        if (error.code === "ENOENT") {
          return res.status(404).json({
            success: false,
            message: "Screenshot file could not be found.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Unable to load the screenshot.",
        });
      }
    },
  );
};

const getTicketActivity = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket ID.",
    });
  }

  const ticket = await Ticket.findById(req.params.id).select("customer");

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support request not found.",
    });
  }

  const staff = ["agent", "admin"].includes(req.user.role);
  const owner = ticket.customer.toString() === req.user._id.toString();

  if (!staff && !owner) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to view this activity.",
    });
  }

  const filter = {
    ticket: ticket._id,
    ...(staff ? {} : { isInternal: false }),
  };

  const activities = await TicketActivity.find(filter)
    .populate("actor", "name email role avatar")
    .sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    activities,
  });
};

const getMyTickets = async (req, res) => {
  const tickets = await ticketView(
    Ticket.find({
      customer: req.user._id,
    }).sort({
      updatedAt: -1,
    }),
  );

  res.status(200).json({
    success: true,
    count: tickets.length,
    tickets,
  });
};

const getQueue = async (req, res) => {
  const { status, priority, category, assigned, search } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (category) {
    filter.category = category;
  }

  if (assigned === "mine") {
    filter.assignedTo = req.user._id;
  } else if (assigned === "unassigned") {
    filter.assignedTo = null;
  }

  if (search) {
    filter.$or = [
      {
        subject: {
          $regex: search,
          $options: "i",
        },
      },

      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const tickets = await ticketView(
    Ticket.find(filter).sort({
      priority: -1,
      updatedAt: -1,
    }),
  );

  res.status(200).json({
    success: true,
    count: tickets.length,
    tickets,
  });
};

const getTicketById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket ID.",
    });
  }

  const ticket = await ticketView(Ticket.findById(req.params.id));

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support request not found.",
    });
  }

  if (!canViewTicket(ticket, req.user)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to view this request.",
    });
  }

  res.status(200).json({
    success: true,
    ticket,
  });
};

const updateTicket = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket ID.",
    });
  }

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support request not found.",
    });
  }

  const isCustomer = ticket.customer.toString() === req.user._id.toString();

  const isAgent = ["agent", "admin"].includes(req.user.role);

  if (!isCustomer && !isAgent) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to update this request.",
    });
  }

  if (isCustomer && req.body.status !== undefined) {
    return res.status(403).json({
      success: false,
      message: "Customers cannot change support status.",
    });
  }

  const previousStatus = ticket.status;
  const previousPriority = ticket.priority;

  const customerFields = [
    "subject",
    "description",
    "expectedResult",
    "actualResult",
    "stepsTaken",
  ];

  const staffFields = [...customerFields, "category", "priority", "status"];

  const allowedFields = isCustomer ? customerFields : staffFields;

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      ticket[field] = req.body[field];
    }
  });

  if (ticket.status === "resolved" && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date();
  }

  if (ticket.status !== "resolved") {
    ticket.resolvedAt = null;
  }

  await ticket.save();

  if (previousStatus !== ticket.status) {
    await recordActivity({
      ticket,
      actor: req.user,
      type: "status-changed",
      message: `Status changed from ${previousStatus.replaceAll("-", " ")} to ${ticket.status.replaceAll("-", " ")}`,
      metadata: {
        from: previousStatus,
        to: ticket.status,
      },
    });
  }

  if (previousPriority !== ticket.priority) {
    await recordActivity({
      ticket,
      actor: req.user,
      type: "priority-changed",
      message: `Priority changed from ${previousPriority} to ${ticket.priority}`,
      metadata: {
        from: previousPriority,
        to: ticket.priority,
      },
    });
  }

  const updated = await ticketView(Ticket.findById(ticket._id));

  res.status(200).json({
    success: true,
    ticket: updated,
  });
};

const assignTicket = async (req, res) => {
  const { assignedTo } = req.body;

  if (assignedTo && !mongoose.isValidObjectId(assignedTo)) {
    return res.status(400).json({
      success: false,
      message: "Invalid agent ID.",
    });
  }

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support request not found.",
    });
  }

  if (assignedTo) {
    const agent = await User.findOne({
      _id: assignedTo,
      role: {
        $in: ["agent", "admin"],
      },
    });

    if (!agent) {
      return res.status(400).json({
        success: false,
        message: "The selected user is not a support agent.",
      });
    }
  }

  const previousAssignee = ticket.assignedTo ? ticket.assignedTo.toString() : null;
  const previousStatus = ticket.status;

  ticket.assignedTo = assignedTo || null;

  if (ticket.status === "open" && assignedTo) {
    ticket.status = "in-progress";
  }

  await ticket.save();

  const newAssignee = ticket.assignedTo ? ticket.assignedTo.toString() : null;

  if (previousAssignee !== newAssignee) {
    let assigneeName = "Unassigned";
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo).select("name");
      assigneeName = assignedUser?.name || "a support agent";
    }

    await recordActivity({
      ticket,
      actor: req.user,
      type: "assignment-changed",
      message: assignedTo
        ? `Assigned to ${assigneeName}`
        : "Ticket unassigned",
      metadata: {
        from: previousAssignee,
        to: newAssignee,
        assigneeName,
      },
    });
  }

  if (previousStatus !== ticket.status) {
    await recordActivity({
      ticket,
      actor: req.user,
      type: "status-changed",
      message: `Status changed from ${previousStatus.replaceAll("-", " ")} to ${ticket.status.replaceAll("-", " ")}`,
      metadata: {
        from: previousStatus,
        to: ticket.status,
      },
    });
  }

  const updated = await ticketView(Ticket.findById(ticket._id));

  res.status(200).json({
    success: true,
    ticket: updated,
  });
};

const getCustomerContext = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support request not found.",
    });
  }

  if (!["agent", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Support staff access only.",
    });
  }

  const previousTickets = await Ticket.find({
    customer: ticket.customer,
    _id: {
      $ne: ticket._id,
    },
  })
    .select("subject status category priority createdAt updatedAt")
    .sort({
      updatedAt: -1,
    })
    .limit(8);

  res.status(200).json({
    success: true,

    context: {
      previousTickets,

      totalPreviousTickets: await Ticket.countDocuments({
        customer: ticket.customer,

        _id: {
          $ne: ticket._id,
        },
      }),
    },
  });
};

module.exports = {
  createTicket,
  getTicketScreenshot,
  getTicketActivity,
  getMyTickets,
  getQueue,
  getTicketById,
  updateTicket,
  assignTicket,
  getCustomerContext,
};
