const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_ROOT = `${API_BASE_URL}/api`;

export function assetUrl(path) {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, options = {}, { dispatchUnauthorized = true } = {}) {
  let response;

  try {
    const isFormData = options.body instanceof FormData;
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      credentials: "include",
      headers: options.body && !isFormData
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
    });
  } catch {
    throw new Error(`Cannot connect to the API at ${API_ROOT}. Check that the backend is running.`);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || `Request failed (${response.status}).`);
    error.status = response.status;
    if (dispatchUnauthorized && response.status === 401 && !["/auth/login", "/auth/me", "/auth/logout"].includes(path)) {
      window.dispatchEvent(new Event("admin:unauthorized"));
    }
    throw error;
  }

  return payload;
}

async function list(path, requestPolicy) {
  const result = await request(`${path}?raw=true&includeInactive=true&limit=50`, {}, requestPolicy);
  if (!Array.isArray(result?.data)) {
    throw new Error("The API returned an unexpected list response.");
  }
  return result.data;
}

export const adminApi = {
  login: (credentials) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  institutions: () => list("/institutions"),
  services: () => list("/services"),
  messages: () => request("/contact/messages"),
  updateMessage: (id, isReviewed) => request(`/contact/messages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ isReviewed }),
  }),
  siteSettings: () => request("/map"),
  updateSiteSettings: (settings) => request("/map", {
    method: "PUT",
    body: JSON.stringify(settings),
  }),
  news: () => list("/news", { dispatchUnauthorized: false }),
  announcements: () => list("/announcements", { dispatchUnauthorized: false }),
  videos: () => list("/videos", { dispatchUnauthorized: false }),
  createInstitution: (data) => request("/institutions", {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  updateInstitution: (id, data) => request(`/institutions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  deactivateInstitution: (id) => request(`/institutions/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteInstitution: (id) => request(`/institutions/${encodeURIComponent(id)}?permanent=true`, { method: "DELETE" }),
  createService: (data) => request("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deactivateService: (id) => request(`/services/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createNews: (data) => request("/news", { method: "POST", body: JSON.stringify(data) }),
  updateNews: (id, data) => request(`/news/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteNews: (id) => request(`/news/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createAnnouncement: (data) => request("/announcements", { method: "POST", body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) => request(`/announcements/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAnnouncement: (id) => request(`/announcements/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createVideo: (data) => request("/videos", { method: "POST", body: JSON.stringify(data) }),
  updateVideo: (id, data) => request(`/videos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteVideo: (id) => request(`/videos/${encodeURIComponent(id)}`, { method: "DELETE" }),
  vipTickets: {
    list: (params = {}) => {
      const search = new URLSearchParams();
      if (params.page) search.set("page", params.page);
      if (params.limit) search.set("limit", params.limit);
      if (params.status && params.status !== "all") search.set("status", params.status);
      const query = search.toString();
      return request(`/admin/vip-tickets${query ? `?${query}` : ""}`);
    },
    updateServiceStatus: (id, status, notes = "") => request(`/admin/vip-tickets/${encodeURIComponent(id)}/service-status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),
    getById: (id) => request(`/admin/vip-tickets/${encodeURIComponent(id)}`),
  },
};