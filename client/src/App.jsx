import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import AgentDashboard from "./pages/AgentDashboard";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return user.role === "customer" ? (
    <Navigate to="/requests" replace />
  ) : (
    <Navigate to="/support" replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedRoute roles={["customer"]} />}>
            <Route path="/requests" element={<CustomerDashboard />} />
            <Route path="/new" element={<NewTicket />} />
          </Route>

          <Route element={<ProtectedRoute roles={["agent", "admin"]} />}>
            <Route path="/support" element={<AgentDashboard />} />
          </Route>

          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
