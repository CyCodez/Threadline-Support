const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong.");
    error.status = response.status;
    throw error;
  }

  return data;
};

const requestBlob = async (path) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.message || "Unable to load the file.");
    error.status = response.status;
    throw error;
  }

  return response.blob();
};

const jsonBody = (value) => JSON.stringify(value);

export const api = {
  register: (body) =>
    request("/auth/register", { method: "POST", body: jsonBody(body) }),
  login: (body) =>
    request("/auth/login", { method: "POST", body: jsonBody(body) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  createTicket: (body) =>
    request("/tickets", { method: "POST", body }),
  myTickets: () => request("/tickets/mine"),
  queue: (query = "") =>
    request(`/tickets/queue${query ? `?${query}` : ""}`),
  ticket: (id) => request(`/tickets/${id}`),
  ticketScreenshot: (id) => requestBlob(`/tickets/${id}/screenshot`),
  ticketActivity: (id) => request(`/tickets/${id}/activity`),
  updateTicket: (id, body) =>
    request(`/tickets/${id}`, { method: "PATCH", body: jsonBody(body) }),
  assignTicket: (id, assignedTo) =>
    request(`/tickets/${id}/assign`, {
      method: "PATCH",
      body: jsonBody({ assignedTo }),
    }),

  messages: (id) => request(`/tickets/${id}/messages`),
  sendMessage: (id, body, isInternal = false) =>
    request(`/tickets/${id}/messages`, {
      method: "POST",
      body: jsonBody({ body, isInternal }),
    }),
  customerContext: (id) => request(`/tickets/${id}/customer-context`),
  adminOverview: () => request("/admin/overview"),
};
