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

function mountCharlaWidget() {
  if (document.querySelector('script[src="https://app.charla.com/widget/widget.js"]')) return;

  const lockTopRight = (element) => {
    element.style.setProperty("position", "fixed", "important");
    element.style.setProperty("top", "5px", "important");
    element.style.setProperty("right", "320px", "important");
    element.style.setProperty("left", "auto", "important");
    element.style.setProperty("bottom", "auto", "important");
    element.style.setProperty("transform", "none", "important");
    element.style.setProperty("z-index", "999999", "important");
  };

  const forcePositionForNode = (node) => {
    if (!(node instanceof HTMLElement)) return;
    const marker = `${node.tagName} ${node.id} ${node.className}`.toLowerCase();
    if (marker.includes("charla") || marker.includes(" widget ")) {
      if (node.classList.contains("widget")) {
        node.classList.remove("left", "center");
        node.classList.add("right");
      }
      lockTopRight(node);
    }

    if (node instanceof HTMLIFrameElement && node.src.toLowerCase().includes("charla")) {
      lockTopRight(node);
    }
  };

  const applyInRoot = (root) => {
    root.querySelectorAll('charla-widget, .widget, .widget.left, .widget.right, .widget.center, iframe[src*="charla"], [id*="charla"], [class*="charla"]').forEach((entry) => {
      forcePositionForNode(entry);
    });
  };

  const applyInShadowRoots = () => {
    document.querySelectorAll("*").forEach((el) => {
      const root = el.shadowRoot;
      if (root) applyInRoot(root);
    });
  };

  if (!document.getElementById("charla-top-right-style")) {
    const style = document.createElement("style");
    style.id = "charla-top-right-style";
    style.textContent = `
      charla-widget {
        position: fixed !important;
        top: 5px !important;
        right: 320px !important;
        left: auto !important;
        bottom: auto !important;
        z-index: 9999 !important;
      }
      .widget,
      .widget.left,
      .widget.right,
      .widget.center,
      iframe[src*="charla"],
      [id*="charla"],
      [class*="charla"] {
        position: fixed !important;
        top: 5px !important;
        right: 320px !important;
        left: auto !important;
        bottom: auto !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);
