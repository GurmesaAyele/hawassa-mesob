const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_ROOT = `${API_BASE_URL}/api`;

export function assetUrl(path) {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  let response;

  try {
    const isFormData = options.body instanceof FormData;
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers: options.body && !isFormData
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
    });
  } catch {
    throw new Error(`Cannot connect to the API at ${API_ROOT}. Check that the backend is running.`);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed (${response.status}).`);
  }

  return payload;
}

async function list(path) {
  const result = await request(`${path}?raw=true&includeInactive=true&limit=50`);
  if (!Array.isArray(result?.data)) {
    throw new Error("The API returned an unexpected list response.");
  }
  return result.data;
}

export const adminApi = {
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
  news: () => list("/news"),
  announcements: () => list("/announcements"),
  videos: () => list("/videos"),
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
};