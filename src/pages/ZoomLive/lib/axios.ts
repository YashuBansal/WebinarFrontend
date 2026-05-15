import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: { [key: string]: string[] };
}


// Utility functions to manage tokens
const getAccessToken = () => localStorage.getItem('accessToken');

const API_BASE_URL =
  import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
    ? import.meta.env.VITE_REACT_APP_API_BASE_URL_DEVELOPMENT
    : import.meta.env.VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION;

const DASHBOARD_BASE_URL = "/"; // Embedded mode

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not set');
}

/** Clear SPA auth + zoom app selection (call after logout or refresh failure). */
export function clearClientAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('wlh-zoom:selectedProject');
}

export function redirectAfterLogout() {
  const base = DASHBOARD_BASE_URL?.trim();
  window.location.href = base && base.length > 0 ? base : '/';
}

/** Voluntary leave Zoom SPA only — does not hit /auth/logout; keeps main SaaS session. */
export function redirectToZoomHome() {
  const path = import.meta.env.VITE_ZOOM_POST_EXIT_PATH?.trim();
  window.location.assign(path && path.length > 0 ? path : '/');
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Avoid interceptor loop while logging out.
const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isHandlingRefreshFailure = false;
const handleRefreshFailure = async () => {
  if (isHandlingRefreshFailure) return;
  isHandlingRefreshFailure = true;

  // Best-effort: server refresh token invalidate + cookie clear
  try {
    await authClient.post('/auth/logout');
  } catch {
    // ignore; we'll still clear local state and redirect
  }

  clearClientAuthStorage();
  redirectAfterLogout();
};

const isAuthRefreshOrLogoutEndpoint = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/refresh') || url.includes('/auth/logout');
};

// Returns an error message based on the status code or a default message
const getErrorMessage = (status: number, defaultMessage?: string) => {
  const errorMessages: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized Access",
    404: "Resource Not Found",
    500: "Internal Server Error",
    429: "Too Many Requests",
  };
  return (
    defaultMessage || errorMessages[status] || "An unknown error occurred."
  );
};

// Dedupe concurrent refresh calls across requests
let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // refresh token is stored in httpOnly cookie, backend reads it via withCredentials
    await authClient.post("/auth/refresh");
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();
    if (accessToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      (error?.response?.status === 401 || error?.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Avoid refresh-interceptor loop on /auth/refresh or /auth/logout itself.
      if (isAuthRefreshOrLogoutEndpoint(originalRequest.url)) {
        await handleRefreshFailure();
        return Promise.reject("Token refresh failed. Please log in again.");
      }

      try {
        await refreshAccessToken();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("refreshError", refreshError);
        console.error("Token refresh failed. Logging out user.");
        await handleRefreshFailure();
        return Promise.reject("Token refresh failed. Please log in again.");
      }
    }

    const errorMessage = getErrorMessage(
      error?.response?.status || 500,
      error?.response?.data?.message
    );
    return Promise.reject(errorMessage);
  }
);

export default axiosInstance;
