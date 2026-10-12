export const APP_BASE_URL = (import.meta.env.VITE_APP_BASE_URL || "https://viva-api-5d4f.onrender.com/api").replace(/\/+$/, "");

const statsWebSocketUrl = new URL('/ws/stats', APP_BASE_URL);
statsWebSocketUrl.protocol = statsWebSocketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
export const STATS_WS_URL = statsWebSocketUrl.href;

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  project_id: import.meta.env.VITE_GOOGLE_PROJECT_ID || "gen-lang-client-0483853890",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
};
