const Ticket = require("../models/Ticket");
const User = require("../models/User");

const overview = async (req, res) => {
  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    totalCustomers,
    totalAgents,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: "open" }),
    Ticket.countDocuments({ status: "in-progress" }),
    Ticket.countDocuments({ status: "waiting-on-customer" }),
    Ticket.countDocuments({ status: "resolved" }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: { $in: ["agent", "admin"] } }),
  ]);

  res.status(200).json({
    success: true,
    overview: {
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      totalCustomers,
      totalAgents,
    },
  });
};

module.exports = { overview };
