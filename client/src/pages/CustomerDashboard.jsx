import React,{ useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

export default function CustomerDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setError("");

      const result = await api.myTickets();

      setTickets(result.tickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in-progress",
  ).length;

  const waitingCount = tickets.filter(
    (ticket) => ticket.status === "waiting-on-customer",
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed",
  ).length;

  return (
    <section className="customer-dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SUPPORT</span>

          <h1>Good to see you, {user?.name?.split(" ")[0]}.</h1>

          <p>Keep an eye on your conversations or start something new.</p>
        </div>

        <Link to="/new" className="button button-primary">
          Start a conversation
        </Link>
      </div>

      <div className="customer-summary">
        <div className="customer-summary-card active">
          <span className="summary-number">{activeCount}</span>

          <span className="summary-label">Active conversations</span>
        </div>

        <div className="customer-summary-card">
          <span className="summary-number">{waitingCount}</span>

          <span className="summary-label">Waiting for you</span>
        </div>

        <div className="customer-summary-card resolved">
          <span className="summary-number">{resolvedCount}</span>

          <span className="summary-label">Resolved</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="panel">Loading your conversations…</div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          text="When something gets in the way, tell us what you were trying to do and we'll take it from there."
          action={
            <Link to="/new" className="button button-primary">
              Start a conversation
            </Link>
          }
        />
      ) : (
        <>
          <div className="requests-heading">
            <div>
              <h2>Your conversations</h2>

              <p>Questions, problems and anything that got in the way.</p>
            </div>
          </div>

          <div className="ticket-list">
            {tickets.map((ticket) => {
              const isResolved =
                ticket.status === "resolved" || ticket.status === "closed";

              return (
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
                      {ticket.category.replaceAll("-", " ")} ·{" "}
                      {isResolved && ticket.resolvedAt
                        ? `Resolved ${new Date(
                            ticket.resolvedAt,
                          ).toLocaleString()}`
                        : new Date(ticket.updatedAt).toLocaleString()}
                    </span>
                  </div>

                  <span className={`priority priority-${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
