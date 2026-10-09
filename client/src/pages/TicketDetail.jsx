import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import "../ticket-activity.css";

const formatDate = (value) =>
  new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const activityIcon = (type) => {
  const icons = {
    "ticket-created": "＋",
    "screenshot-attached": "▧",
    "status-changed": "↻",
    "priority-changed": "⚑",
    "assignment-changed": "↗",
    "reply-added": "↩",
    "internal-note": "🔒",
  };
  return icons[type] || "•";
};

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const staff = user?.role === "agent" || user?.role === "admin";

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [context, setContext] = useState(null);
  const [message, setMessage] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const [activityError, setActivityError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [ticketResult, messageResult, activityResult] = await Promise.all([
        api.ticket(id),
        api.messages(id),
        api.ticketActivity(id),
      ]);

      setTicket(ticketResult.ticket);
      setMessages(messageResult.messages || []);
      setActivities(activityResult.activities || []);
      setActivityError("");

      if (staff) {
        try {
          const contextResult = await api.customerContext(id);
          setContext(contextResult.context);
        } catch {
          setContext(null);
        }
      } else {
        setContext(null);
      }
    } catch (err) {
      setError(err.message || "Unable to load this conversation.");
    }
  };

  useEffect(() => {
    load();
  }, [id, staff]);

  useEffect(() => {
    let objectUrl = "";

    const loadScreenshot = async () => {
      if (!ticket?.screenshot?.storageName) {
        setScreenshotUrl("");
        setScreenshotError("");
        return;
      }

      try {
        setScreenshotError("");
        const blob = await api.ticketScreenshot(id);
        objectUrl = URL.createObjectURL(blob);
        setScreenshotUrl(objectUrl);
      } catch (err) {
        setScreenshotUrl("");
        setScreenshotError(err.message || "Unable to load screenshot.");
      }
    };

    loadScreenshot();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, ticket?.screenshot?.storageName]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    setBusy(true);
    setError("");

    try {
      await api.sendMessage(id, message, internal);
      setMessage("");
      setInternal(false);
      await load();
    } catch (err) {
      setError(err.message || "Unable to send your reply.");
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (status) => {
    setError("");
    try {
      await api.updateTicket(id, { status });
      await load();
    } catch (err) {
      setError(err.message || "Unable to update the status.");
    }
  };

  if (error && !ticket) {
    return <div className="form-error">{error}</div>;
  }

  if (!ticket) {
    return <div className="panel">Loading conversation…</div>;
  }

  return (
    <section>
      <div className="detail-top">
        <Link to={staff ? "/support" : "/"} className="back-link">
          ← Back
        </Link>

        <div className="detail-heading">
          <div>
            <span className="eyebrow">
              {ticket.category?.replaceAll("-", " ")}
            </span>
            <h1>{ticket.subject}</h1>
            <p>
              Started {formatDate(ticket.createdAt)} · {ticket.customer?.name}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="conversation-column">
          <div className="context-card">
            <span className="context-label">WHAT HAPPENED</span>
            <p>{ticket.description}</p>

            {(ticket.expectedResult || ticket.actualResult || ticket.stepsTaken) && (
              <div className="context-details">
                {ticket.expectedResult && (
                  <div>
                    <strong>Expected</strong>
                    <p>{ticket.expectedResult}</p>
                  </div>
                )}
                {ticket.actualResult && (
                  <div>
                    <strong>Instead</strong>
                    <p>{ticket.actualResult}</p>
                  </div>
                )}
                {ticket.stepsTaken && (
                  <div>
                    <strong>Already tried</strong>
                    <p>{ticket.stepsTaken}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {ticket.screenshot?.storageName && (
            <section className="screenshot-detail-card">
              <div className="screenshot-detail-heading">
                <div>
                  <span className="context-label">ATTACHMENT</span>
                  <h3>Screenshot</h3>
                </div>
                {ticket.screenshot.originalName && (
                  <span className="screenshot-detail-name">
                    {ticket.screenshot.originalName}
                  </span>
                )}
              </div>

              {screenshotUrl ? (
                <a href={screenshotUrl} target="_blank" rel="noreferrer">
                  <div className="screenshot-detail-image-wrap">
                    <img src={screenshotUrl} alt="Screenshot attached to this ticket" />
                  </div>
                </a>
              ) : screenshotError ? (
                <p className="screenshot-detail-error">{screenshotError}</p>
              ) : (
                <p className="screenshot-detail-loading">Loading screenshot…</p>
              )}
            </section>
          )}

          <section className="activity-panel">
            <div className="activity-heading">
              <div>
                <span className="context-label">TICKET HISTORY</span>
                <h2>Activity</h2>
              </div>
              <span className="activity-count">{activities.length}</span>
            </div>

            {activityError && (
              <p className="activity-error">{activityError}</p>
            )}

            {activities.length === 0 ? (
              <p className="activity-empty">
                Important updates will appear here as this conversation progresses.
              </p>
            ) : (
              <ol className="activity-timeline">
                {activities.map((item) => (
                  <li className="activity-item" key={item._id}>
                    <span className="activity-icon" aria-hidden="true">
                      {activityIcon(item.type)}
                    </span>
                    <div className="activity-content">
                      <div className="activity-title-row">
                        <strong>{item.message}</strong>
                        {item.isInternal && staff && (
                          <span className="activity-private">Internal</span>
                        )}
                      </div>
                      <p>
                        {item.actor?.name || "Threadline"} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="messages">
            <div className="activity-heading">
              <div>
                <span className="context-label">CONVERSATION</span>
                <h2>Messages</h2>
              </div>
            </div>

            {messages.map((item) => (
              <article
                key={item._id}
                className={`message ${item.isInternal ? "message-internal" : ""}`}
              >
                <div className="message-meta">
                  <strong>{item.sender?.name}</strong>
                  <span>{formatDate(item.createdAt)}</span>
                  {item.isInternal && <em>Internal note</em>}
                </div>
                <p>{item.body}</p>
              </article>
            ))}
          </section>

          <form className="reply-box" onSubmit={sendMessage}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                internal
                  ? "Leave a private note for the support team…"
                  : "Write a reply…"
              }
              rows={5}
              required
            />

            <div className="reply-actions">
              {staff && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(event) => setInternal(event.target.checked)}
                  />
                  Internal note
                </label>
              )}
              <button className="button button-primary" disabled={busy}>
                {busy ? "Sending…" : internal ? "Add note" : "Reply"}
              </button>
            </div>
          </form>

          {error && <div className="form-error">{error}</div>}
        </div>

        <aside className="side-panel">
          <div className="side-card">
            <span className="context-label">REQUEST</span>

            <div className="side-field">
              <span>Status</span>
              {staff ? (
                <select
                  value={ticket.status}
                  onChange={(event) => updateStatus(event.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In progress</option>
                  <option value="waiting-on-customer">Waiting on customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>

            <div className="side-field">
              <span>Priority</span>
              <strong className={`priority priority-${ticket.priority}`}>
                {ticket.priority}
              </strong>
            </div>

            <div className="side-field">
              <span>Category</span>
              <strong>{ticket.category?.replaceAll("-", " ")}</strong>
            </div>

            {ticket.assignedTo && (
              <div className="side-field">
                <span>Assigned to</span>
                <strong>{ticket.assignedTo.name}</strong>
              </div>
            )}
          </div>

          {staff && context && (
            <div className="side-card">
              <span className="context-label">CUSTOMER CONTEXT</span>
              <h3>{ticket.customer?.name}</h3>
              <p className="muted">{ticket.customer?.email}</p>
              <p className="context-stat">
                {context.totalPreviousTickets} previous conversations
              </p>

              {context.previousTickets?.length > 0 && (
                <div className="history-list">
                  {context.previousTickets.slice(0, 5).map((item) => (
                    <div key={item._id}>
                      <strong>{item.subject}</strong>
                      <span>{item.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
