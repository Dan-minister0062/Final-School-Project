import axios from "axios";

// Use the environment variable directly
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const CSRF_URL =
  import.meta.env.VITE_CSRF_URL || "http://localhost:8000/sanctum/csrf-cookie";

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 120000,

  // Session cookies (Laravel Sanctum SPA flow) are required for auth.
  withCredentials: true,

  // The frontend and API use different local ports. Explicitly opt in to
  // Axios sending Laravel's XSRF-TOKEN cookie back as X-XSRF-TOKEN.
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// In-memory identity mirror used by background services so they don't need
// to read persisted session data. Never written to browser storage.
let authIdentity = null;

export const setAuthIdentity = (identity) => {
  authIdentity = identity || null;
};

export const getAuthIdentity = () => authIdentity;

// Fetch the XSRF-TOKEN cookie before state-changing requests so the Laravel
// web middleware (ValidateCsrfToken) accepts the SPA's session requests.
export const fetchCsrfCookie = async () => {
  await axios.get(CSRF_URL, { withCredentials: true });
};

// Independently probes whether the server-side Sanctum session is still valid.
// Unlike the shared `api` instance this deliberately uses a bare axios client,
// so a negative result here can never re-trigger the session:expired event
// (and send the user to /login) from inside the verification itself.
//
// Returns { alive: true, data } (raw /auth/me payload) when the session is
// confirmed, { alive: false } on a definitive 401/403. Throws on
// network/5xx/timeout after a single retry (with a fresh XSRF-TOKEN cookie)
// so the caller can decide the fallback.
export const verifySessionAlive = async () => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await axios.get(CSRF_URL, { withCredentials: true });
      const res = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        timeout: 25000,
      });
      if (res.data?.user) return { alive: true, data: res.data };
      return { alive: false };
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return { alive: false };
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Session verification failed.");
};

// Response interceptor: a 401 means the server session expired or was
// revoked. The app reacts by clearing the in-memory auth state.
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session:expired"));
    }

    return Promise.reject(error);
  }
);

export default api;
