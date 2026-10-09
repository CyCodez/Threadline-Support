import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout register-page">
      <div className="auth-intro">
        <span className="eyebrow">THREADLINE</span>
        <h1>Tell us what you were trying to do.</h1>
        <p>
          You don't need to know the technical name for a problem. Just explain
          what happened and we'll take it from there.
        </p>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div>
          <span className="eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="muted">Your support conversations stay together.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </label>

        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
