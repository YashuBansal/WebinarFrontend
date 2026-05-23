import axios from "axios";

export const baseURL =
  import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
    ? import.meta.env.VITE_REACT_APP_API_BASE_URL_DEVELOPMENT
    : import.meta.env.VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION;

// Returns an error message based on the status code or a default message
const getErrorMessage = (status, defaultMessage) => {
  const errorMessages = {
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

let store;
export const injectStore = (_store) => {
  store = _store;
};

const logoutAndRedirectToLogin = () => {
  store?.dispatch({ type: "auth/logout" });
  const publicPaths = ["/login", "/signup", "/policy", "/terms", "/support", "/documentation"];
  if (
    typeof window !== "undefined" &&
    !publicPaths.includes(window.location.pathname)
  ) {
    window.location.href = "/login";
  }
};

// Dedupe concurrent refresh calls across requests
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // refresh token is stored in httpOnly cookie, so backend reads it via withCredentials
    await instance.post("/auth/refresh");
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};
export const instance = axios.create({
  withCredentials: true,
  baseURL,
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?.url?.includes("auth/refresh")) {
      logoutAndRedirectToLogin();
      const errorMessage = getErrorMessage(
        error?.response?.status,
        error?.response?.data?.message
      );
      return Promise.reject(errorMessage);
    }

    if (
      (error?.response?.status === 401 || error?.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();

        return instance(originalRequest);
      } catch (refreshError) {
        logoutAndRedirectToLogin();
        return Promise.reject("Token refresh failed. Please log in again.");
      }
    }

    const errorMessage = getErrorMessage(
      error?.response?.status,
      error?.response?.data?.message
    );
    return Promise.reject(errorMessage);
  }
);
