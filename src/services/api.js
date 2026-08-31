import axios from "axios";

// Use the environment variable directly
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 30000,
});

const getValidToken = () => {
  const token = localStorage.getItem("token");

  return token && token !== "undefined" && token !== "null"
    ? token
    : null;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getValidToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const hadAuthHeader = !!error.config?.headers?.Authorization;
      const currentToken = localStorage.getItem("token");
      const isDemoToken =
        currentToken && currentToken.startsWith("demo-");

      // Only treat 401 as "session expired"
      // when we actually sent a real token.
      if (hadAuthHeader && !isDemoToken) {
        // Clear only authentication keys
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;