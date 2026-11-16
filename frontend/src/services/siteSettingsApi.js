import { API_CONFIG } from "../config/api";

const API_BASE_URL = API_CONFIG.BASE_URL;

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
