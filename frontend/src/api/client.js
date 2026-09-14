import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
// Long enough for a normal hosted request, but finite so a stalled connection
// cannot keep a destructive action pending forever.
const REQUEST_TIMEOUT_MS = 15000;

const client = axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("taska_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    const message = timedOut
      ? "The request took too long. Please check your connection and try again."
      : error.response?.data?.error?.message ||
        error.message ||
        "Something went wrong. Please try again.";
    const details = error.response?.data?.error?.details;
    return Promise.reject({ message, details, status: error.response?.status });
  }
);

export default client;
