/**
 * realtime.js
 *
 * Lightweight, high-reliability Server-Sent Events (SSE) broadcaster for
 * real-time queue telemetry across Hawassa Mesob Public TV Display,
 * Staff Desks, and Admin Management Dashboards.
 */

const sseClients = new Set();

/**
 * Express handler for GET /api/vip-dashboard/stream
 * Opens a persistent SSE channel for real-time queue & desk updates.
 */
export function handleSseStream(req, res) {
  // Disable socket timeouts
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disables buffering on Nginx reverse proxies
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  });

  // Flush headers immediately
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  // Register client
  sseClients.add(res);

  // Send initial handshake
  const initialPayload = JSON.stringify({
    type: "CONNECTED",
    subscribers: sseClients.size,
    timestamp: Date.now(),
  });
  res.write(`event: connected\ndata: ${initialPayload}\n\n`);

  // Heartbeat keepalive every 15 seconds to prevent NAT/proxy disconnections
  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  // Clean up when client disconnects
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });

  req.on("error", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
}

/**
 * Broadcast an event to all connected displays, admin tabs, and staff dashboards.
 * @param {Object} eventData - Payload describing what changed on the server.
 */
export function broadcastQueueUpdate(eventData = {}) {
  if (sseClients.size === 0) return;

  const payload = JSON.stringify({
    type: eventData.type || "QUEUE_UPDATED",
    timestamp: Date.now(),
    ...eventData,
  });

  const message = `event: queue_update\ndata: ${payload}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

/**
 * Returns the number of currently connected SSE clients.
 */
export function getActiveSubscribersCount() {
  return sseClients.size;
}
