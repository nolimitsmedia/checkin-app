import axios from "axios";

// ✅ Create Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  withCredentials: false, // false for token-based auth
});

// ✅ Attach token to request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle errors (401 → clear token, no redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem("token");

    if (!error.response) {
      console.error("🔌 Network error - is backend running?");
    } else if (error.response.status === 401) {
      console.warn(
        "🚫 Unauthorized (401):",
        error.response.data?.message || "Invalid or expired token"
      );

      // Clear token if it exists, but DO NOT redirect
      if (token) {
        localStorage.removeItem("token");
        console.info("🔒 Token cleared due to 401 response.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
