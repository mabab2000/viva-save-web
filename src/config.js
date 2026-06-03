export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || "https://viva-api-366k.onrender.com/api";

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  project_id: import.meta.env.VITE_GOOGLE_PROJECT_ID || "gen-lang-client-0483853890",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
};