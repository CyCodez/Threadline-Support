import React from "react";

export default function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">—</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
