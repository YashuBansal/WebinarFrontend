import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./App";
import store from "./features/store";
import persistStore from "redux-persist/es/persistStore";
import { injectStore } from "./services/axiosInterceptor";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { injectStoreInDateFormat } from "./utils/extra";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function enforceAntiClickjacking() {
  if (typeof window === "undefined") return;

  // Hide UI until we know this window is not framed.
  if (document?.documentElement) {
    document.documentElement.style.display = "none";
  }

  const unhide = () => {
    if (document?.documentElement) {
      document.documentElement.style.display = "";
    }
  };

  if (window.self === window.top) {
    unhide();
    return;
  }

  try {
    window.top.location = window.self.location;
  } catch (_error) {
    // Cross-origin framing: keep the app hidden as a safe fallback.
    return;
  }

  unhide();
}

enforceAntiClickjacking();

function mountCharlaWidget() {
  if (
    document.querySelector(
      'script[src="https://app.charla.com/widget/widget.js"]',
    )
  )
    return;
  const widgetElement = document.createElement("charla-widget");
  widgetElement.setAttribute("p", "d962825c-a38f-4cd8-90ab-90616f476692");
  document.body.appendChild(widgetElement);
  const widgetCode = document.createElement("script");
  widgetCode.src = "https://app.charla.com/widget/widget.js";
  widgetCode.onload = () => {
    const applyEverywhere = () => {
      lockTopRight(widgetElement);
      applyInRoot(document);
      applyInShadowRoots();
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((added) => {
          if (!(added instanceof Element)) return;
          forcePositionForNode(added);
          applyInRoot(added);
        });
      });
      applyEverywhere();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    applyEverywhere();

    let attempts = 0;
    const retry = () => {
      applyEverywhere();
      attempts += 1;
      if (attempts < 20) window.setTimeout(retry, 500);
      else observer.disconnect();
    };
    retry();
  };
  document.body.appendChild(widgetCode);
}

if (document.readyState === "complete") {
  mountCharlaWidget();
} else {
  window.addEventListener("load", mountCharlaWidget);
}

injectStore(store);
injectStoreInDateFormat(store);
let persistor = persistStore(store);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
    },
  },
});

import { ThemeProvider } from "./contexts/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>,
);
