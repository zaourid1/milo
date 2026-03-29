// API base URL — reads from NEXT_PUBLIC_API_URL env var, falls back to localhost for dev
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// WebSocket base — derives ws:// or wss:// from the API_BASE
export const WS_BASE = API_BASE.replace(/^http/, "ws");
