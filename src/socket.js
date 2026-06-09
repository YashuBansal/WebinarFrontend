import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the window.location object
const URL =
  import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
    ? import.meta.env.VITE_REACT_APP_SOCKET_BASE_URL_DEVELOPMENT
    : import.meta.env.VITE_REACT_APP_SOCKET_BASE_URL_MAIN_PRODUCTION;

// Variable to hold the interval ID
let reconnectIntervalId = null;
const RECONNECT_INTERVAL = 5000; // 5 seconds

// This variable will hold the auth state, controlled by your app
let isUserLoggedIn = false;

export const socket = io(URL, {
  // --- KEY CHANGES ---
  autoConnect: false, // 1. Disable auto-connection. We will connect manually.
  reconnection: false, // We will continue to handle reconnection manually
  // --------------------
  transports: ['websocket'],
});

// --- Event Listeners ---

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
  // If a manual reconnect interval was running, clear it upon successful connection
  if (reconnectIntervalId) {
    clearInterval(reconnectIntervalId);
    reconnectIntervalId = null;
    console.log("Successfully reconnected, stopping manual interval.");
  }
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
  // Clear any existing interval to be safe
  if (reconnectIntervalId) {
    clearInterval(reconnectIntervalId);
    reconnectIntervalId = null;
  }

  // 2. Only attempt to reconnect if the user is supposed to be logged in.
  // This prevents reconnection attempts after a manual logout.
  if (isUserLoggedIn) {
    console.log(`Starting manual reconnect interval (${RECONNECT_INTERVAL}ms)...`);
    reconnectIntervalId = setInterval(() => {
      console.log("Attempting manual reconnect...");
      socket.connect(); // Attempt to reconnect
    }, RECONNECT_INTERVAL);
  } else {
    console.log("User is not logged in. No reconnection attempts will be made.");
  }
});

socket.on("connect_error", (error) => {
  console.error("Connection Error:", error.message);
  // The 'disconnect' event will usually follow a 'connect_error',
  // which will then trigger our reconnection logic if the user is logged in.
  // No need to start the interval here to avoid race conditions.
});

// --- Real-time CSV Import Pipeline Socket Bindings ---
import { startImport, failImport } from "./features/slices/importProgress";
import { createThrottledProgressDispatcher, createBatchLogDispatcher } from "./utils/socketThrottler";

let store;
let throttledProgressDispatcher;
let throttledLogDispatcher;

export const injectStoreToSocket = (_store) => {
  store = _store;
  throttledProgressDispatcher = createThrottledProgressDispatcher(store);
  throttledLogDispatcher = createBatchLogDispatcher(store);
};

// Start signal
socket.on("import:start", (data) => {
  if (store) {
    store.dispatch(startImport(data));
  }
});

// Throttled progress telemetry (fires every 400ms max)
socket.on("import:progress", (data) => {
  if (throttledProgressDispatcher) {
    throttledProgressDispatcher(data);
  }
});

// Batched log stream aggregation (flushes accumulated logs every 400ms)
socket.on("import:log", (data) => {
  if (throttledLogDispatcher) {
    throttledLogDispatcher(data);
  }
});

// Failure handler
socket.on("import:failed", (errorMsg) => {
  if (store) {
    store.dispatch(failImport(errorMsg));
  }
});




// --- Socket Manager ---
// 3. Export a manager object to control the socket from your application
export const socketManager = {
  /**
   * To be called when the user logs in.
   */
  connect: () => {
    isUserLoggedIn = true;
    // Only attempt to connect if we are not already connected or connecting
    if (!socket.connected) {
      console.log("User logged in. Attempting to connect socket...");
      socket.connect();
    }
  },

  /**
   * To be called when the user logs out.
   */
  disconnect: () => {
    isUserLoggedIn = false;
    // Stop any reconnection attempts
    if (reconnectIntervalId) {
      clearInterval(reconnectIntervalId);
      reconnectIntervalId = null;
    }
    // Disconnect the socket
    if (socket.connected) {
      console.log("User logged out. Disconnecting socket...");
      socket.disconnect();
    }
  },
};