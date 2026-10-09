import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const categories = [
  ["account", "Account & login"],
  ["gallery", "Gallery"],
  ["client-access", "Client access"],
  ["selection", "Client selection"],
  ["payments", "Payments"],
  ["bookings", "Bookings"],
  ["subscription", "Subscription"],
  ["technical", "Something technical"],
  ["other", "Something else"],
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedFileTypes = ["image/png", "image/jpeg", "image/webp"];

export default function NewTicket() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "other",
    priority: "normal",
    expectedResult: "",
    actualResult: "",
    stepsTaken: "",
  });

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  const handleScreenshot = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!allowedFileTypes.includes(file.type)) {
      setError("Please choose a PNG, JPG or WEBP image.");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "That image is too large. Please choose an image smaller than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }

    setScreenshot(null);
    setScreenshotPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const result = await api.createTicket(formData);

      navigate(`/tickets/${result.ticket._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="narrow-page new-ticket-page">
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">NEW CONVERSATION</span>

          <h1>What got in the way?</h1>

          <p>
            Tell us what you were trying to do. You don't need to translate it
            into technical language.
          </p>
        </div>
      </div>

      <form className="form-card" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          What are you trying to do?
          <input
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="For example: My client can't download the gallery"
            required
            maxLength={150}
          />
        </label>

        <label>
          What happened?
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Tell us what you saw, what stopped working, or what seemed unusual."
            rows={6}
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Which part were you using?
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {categories.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            How much is this getting in your way?
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
            >
              <option value="low">A little inconvenient</option>

              <option value="normal">I need some help</option>

              <option value="high">It's blocking my work</option>

              <option value="urgent">My work is stopped</option>
            </select>
          </label>
        </div>

        <div className="form-section">
          <div>
            <h3>A little more context</h3>

            <p className="muted">
              These are optional, but they can save a round of questions later.
            </p>
          </div>

          <label>
            What did you expect to happen?
            <textarea
              value={form.expectedResult}
              onChange={(e) => update("expectedResult", e.target.value)}
              placeholder="What should have happened?"
              rows={3}
            />
          </label>

          <label>
            What happened instead?
            <textarea
              value={form.actualResult}
              onChange={(e) => update("actualResult", e.target.value)}
              placeholder="What did you actually see?"
              rows={3}
            />
          </label>

          <label>
            What have you already tried?
            <textarea
              value={form.stepsTaken}
              onChange={(e) => update("stepsTaken", e.target.value)}
              placeholder="Anything you tried before contacting us."
              rows={3}
            />
          </label>

          <div className="screenshot-field">
            <div className="screenshot-heading">
              <div>
                <h4>Can you show us what you're seeing?</h4>

                <p>
                  If it's easier, add a screenshot of the problem. This can help
                  us understand error messages, unexpected screens, or anything
                  that's difficult to explain in words.
                </p>
              </div>
            </div>

            {!screenshot ? (
              <button
                type="button"
                className="screenshot-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="screenshot-upload-icon">↑</span>

                <span>
                  <strong>Add a screenshot</strong>

                  <small>PNG, JPG or WEBP · Up to 5 MB</small>
                </span>
              </button>
            ) : (
              <div className="screenshot-preview">
                <div className="screenshot-image-wrap">
                  <img
                    src={screenshotPreview}
                    alt="Preview of the screenshot attached to this support request"
                  />
                </div>

                <div className="screenshot-file-info">
                  <div>
                    <strong>{screenshot.name}</strong>

                    <span>{(screenshot.size / 1024).toFixed(0)} KB</span>
                  </div>

                  <button
                    type="button"
                    className="screenshot-remove"
                    onClick={removeScreenshot}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleScreenshot}
              hidden
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="button button-quiet"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>

          <button className="button button-primary" disabled={busy}>
            {busy ? "Sending…" : "Send to support"}
          </button>
        </div>
      </form>
    </section>
  );
}
