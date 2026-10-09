import { useState } from "react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
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
      const result = await login(form);
      const destination =
        result.user.role === "customer" ? "/" : "/support";
      navigate(location.state?.from || destination);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout login-page">
      <div className="auth-intro">
        <span className="eyebrow">THREADLINE</span>
        <h1>Good support starts with listening.</h1>
        <p>
          A quieter way to handle customer problems, keep the context intact,
          and get people back to what they were trying to do.
        </p>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in</h2>
          <p className="muted">Pick up where you left off.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

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
            placeholder="Your password"
            required
          />
        </label>

        <button className="button button-primary button-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
