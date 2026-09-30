import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
// Attach the access token to every outgoing request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR (Token Refresh Logic) ───────────────────────────────
// If a request gets a 401 Unauthorized response, it means the access token
// has expired. We silently call /refresh with the refreshToken, get a new
// access token, and retry the original request — the user never sees an error.

let isRefreshing = false;         // prevent multiple simultaneous refresh calls
let failedQueue = [];             // queue of requests that came in during refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response, // success — just pass through

  async (error) => {
    const originalRequest = error.config;

    // Only try to refresh on 401 and if we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      // No refresh token stored → force logout, go to login
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another refresh is already in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark as retried so we don't loop infinitely
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call backend /refresh endpoint
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = res.data.token;

        // Save the new access token
        localStorage.setItem("token", newAccessToken);
        axiosInstance.defaults.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Retry all queued requests with new token
        processQueue(null, newAccessToken);

        // Retry the original failed request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token itself is expired/invalid → force logout
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
