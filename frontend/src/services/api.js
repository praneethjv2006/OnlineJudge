import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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
        const response = await axios.post("http://localhost:5000/api/auth/refresh", {}, {
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

export default api;
