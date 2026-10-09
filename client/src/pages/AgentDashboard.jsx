import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";


export default function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    assigned: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const result = await api.queue(params.toString());
      setTickets(result.tickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.priority, filters.category, filters.assigned]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SUPPORT WORKSPACE</span>
          <h1>The queue</h1>
          <p>See what customers need and decide what needs attention next.</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search conversations…"
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
          onKeyDown={(e) => e.key === "Enter" && load()}
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="in-progress">In progress</option>
          <option value="waiting-on-customer">Waiting on customer</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) =>
            setFilters({ ...filters, priority: e.target.value })
          }
        >
          <option value="">Any priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filters.assigned}
          onChange={(e) =>
            setFilters({ ...filters, assigned: e.target.value })
          }
        >
          <option value="">Everyone</option>
          <option value="mine">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="panel">Loading the queue…</div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="The queue is clear"
          text="Nothing matches the current filters."
        />
      ) : (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <Link
              to={`/tickets/${ticket._id}`}
              className="ticket-row"
              key={ticket._id}
            >
              <div className="ticket-main">
                <div className="ticket-title-line">
                  <h3>{ticket.subject}</h3>
                  <StatusBadge status={ticket.status} />
                </div>

                <p>{ticket.description}</p>

                <span className="ticket-meta">
                  {ticket.customer?.name} ·{" "}
                  {ticket.category.replaceAll("-", " ")} ·{" "}
                  {new Date(ticket.updatedAt).toLocaleString()}
                </span>
              </div>

              <span className={`priority priority-${ticket.priority}`}>
                {ticket.priority}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
