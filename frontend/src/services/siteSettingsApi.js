const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

export async function getContactDetails() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/contact`);
  } catch {
    throw new Error("Cannot connect to the server. Contact details are unavailable.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Contact details request failed (${response.status}).`);
  }
  return payload;
}
