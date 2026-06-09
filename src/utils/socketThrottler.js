import { updateImportProgress, addBulkLogs } from '../features/slices/importProgress';

/**
 * A highly optimized, custom throttle function with zero third-party dependencies.
 * Includes leading/trailing execution controls and a .cancel() hook to prevent memory leaks.
 */
function throttle(func, wait, options = {}) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;

  const { leading = true, trailing = true } = options;

  const invokeFunc = (time) => {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = lastThis = null;
    lastCallTime = time;
    func.apply(thisArg, args);
  };

  const throttled = function (...args) {
    const now = Date.now();
    if (!lastCallTime && leading === false) {
      lastCallTime = now;
    }
    
    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invokeFunc(now);
    } else if (!timeoutId && trailing !== false) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        invokeFunc(Date.now());
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = lastThis = null;
  };

  return throttled;
}

/**
 * Technique A: Value Throttling for Progress Indicators
 * Drops intermediate states and guarantees UI progress bar updates occur at most once every 400ms.
 */
export const createThrottledProgressDispatcher = (store) => {
  return throttle(
    (payload) => {
      store.dispatch(updateImportProgress(payload));
    },
    400,
    { leading: true, trailing: true }
  );
};

/**
 * Technique B: Queue-Based Accumulation Batching for Discrete Logs
 * Gathers every event chunk into an array buffer and flushes it as a single
 * collective Redux action every 400ms, preserving every detail.
 */
export const createBatchLogDispatcher = (store) => {
  let logBufferQueue = [];

  const flushLogs = () => {
    if (logBufferQueue.length === 0) return;
    
    // Dequeue buffered items
    const batchPayload = [...logBufferQueue];
    logBufferQueue = [];
    
    // Single atomic store update
    store.dispatch(addBulkLogs(batchPayload));
  };

  const throttledFlush = throttle(flushLogs, 400, { leading: false, trailing: true });

  return (logItem) => {
    const item = {
      id: logItem.id || `log-${Date.now()}-${Math.random()}`,
      timestamp: logItem.timestamp || new Date().toLocaleTimeString(),
      message: logItem.message || '',
      type: logItem.type || 'info',
    };
    
    logBufferQueue.push(item);
    throttledFlush();
  };
};
