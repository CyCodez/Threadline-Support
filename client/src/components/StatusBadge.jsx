import React from "react";

const labels = {
  open: "Open",
  "in-progress": "In progress",
  "waiting-on-customer": "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`status status-${status}`}>
      <span className="status-dot" />
      {labels[status] || status}
    </span>
  );
}
