import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  const staff = user?.role === "agent" || user?.role === "admin";

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">t</span>
          <span>threadline</span>
        </NavLink>

        <nav className="topnav">
          {staff ? (
            <NavLink to="/support">Support</NavLink>
          ) : (
            <NavLink to="/">My requests</NavLink>
          )}

          <span className="user-name">{user?.name}</span>
          <button className="button button-quiet" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
