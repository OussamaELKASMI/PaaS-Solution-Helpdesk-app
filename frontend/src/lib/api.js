const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

async function request(path, { token, headers, ...options } = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.detail || "Something went wrong while calling the API.");
  }

  return payload;
}

export function loginRequest(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", { token });
}

export function registerRequest(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getUsers(token, filters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.role) {
    searchParams.set("role", filters.role);
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return request(`/users${suffix}`, { token });
}

export function getStaffUsers(token) {
  return request("/users/staff", { token });
}

export function updateUserRoleRequest(token, userId, role) {
  return request(`/users/${userId}/role`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ role }),
  });
}

export function getTickets(token, filters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.status) {
    searchParams.set("status_filter", filters.status);
  }

  if (filters.priority) {
    searchParams.set("priority", filters.priority);
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return request(`/tickets${suffix}`, { token });
}

export function getTicket(token, ticketId) {
  return request(`/tickets/${ticketId}`, { token });
}

export function createTicket(token, data) {
  return request("/tickets", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateTicket(token, ticketId, data) {
  return request(`/tickets/${ticketId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function addComment(token, ticketId, data) {
  return request(`/tickets/${ticketId}/comments`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function getAdminStats(token) {
  return request("/admin/stats", { token });
}

export function uploadAttachment(token, ticketId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return request(`/tickets/${ticketId}/attachments`, {
    method: "POST",
    token,
    body: formData,
  });
}

export function deleteAttachment(token, ticketId, attachmentId) {
  return request(`/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: "DELETE",
    token,
  });
}
