import axios from "axios";

// IS_DEPLOYED is derived from the environment variable if needed, 
// Hardcoding the Render URL so that incorrect Cloudflare Pages environment variables are ignored
const BASE_URL = "https://onlinejudge-xtob.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor to attach the access token
api.interceptors.request.use((config) => {
  const accessToken = window.localStorage.getItem("accessToken");

  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Handle token refreshing logic to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(null, token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(error, null));
  refreshSubscribers = [];
};

// Response interceptor to handle token expiration (401 errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register")
    ) {
      if (isRefreshing) {
        // If already refreshing, wait for the new token
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((err, token) => {
            if (err) {
              reject(err);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        const { accessToken } = response.data;

        if (accessToken) {
          window.localStorage.setItem("accessToken", accessToken);
          isRefreshing = false;
          onTokenRefreshed(accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("Session expired.");
        }
      } catch (refreshError) {
        isRefreshing = false;
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("user");
        onTokenRefreshFailed(refreshError);
        // Force redirect to login page
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extract a user-friendly error message from an axios error.
 * Prefers the backend's `message` field, then falls back to
 * descriptive messages for network / timeout / CORS errors.
 */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  // Backend responded with an error payload
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Network error (no response at all) — could be CORS, server down, or no internet
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Request timed out
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  // Rate limited (429) without a message body
  if (error?.response?.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Server error (5xx) without a message body
  if (error?.response?.status >= 500) {
    return "A server error occurred. Please try again later.";
  }

  return fallback;
};

export default api;
