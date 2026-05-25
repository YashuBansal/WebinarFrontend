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

  if (document.getElementById("charla-drag-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "charla-drag-wrapper";
  wrapper.style.cssText = `
    position: fixed;
    bottom: -10px;
    right: -5px;
    z-index: 999999;
    cursor: grab;
    transform: translate(0px, 0px);
    transition: transform 0.3s ease;
  `;

  const widgetElement = document.createElement("charla-widget");
  widgetElement.setAttribute("p", "d962825c-a38f-4cd8-90ab-90616f476692");
  wrapper.appendChild(widgetElement);

  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: absolute;
    bottom: 80px;
    right: 35px;
    width: 20px;
    height: 20px;
    background-color: #ff4d4f;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1000000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    line-height: 1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease-in-out;
  `;
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    wrapper.remove();
  });

  wrapper.appendChild(closeBtn);

  document.body.appendChild(wrapper);

  const style = document.createElement("style");
  style.innerHTML = `
    #charla-drag-wrapper charla-widget {
      position: relative !important;
      bottom: auto !important;
      right: auto !important;
      left: auto !important;
      top: auto !important;

      flex-shrink: 0 !important;
      min-width: 165px !important;
      display: block !important;
    }
    .charla-is-dragging * {
      pointer-events: none !important;
    }
    .charla-disable-selection {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }
  `;
  document.head.appendChild(style);

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

  const checkWidgetLoaded = setInterval(() => {
    // Agar widgetElement ke andar child elements aa gaye ya Shadow DOM ban gaya matlab wo load ho gaya hai
    if (widgetElement.children.length > 0 || widgetElement.shadowRoot) {
      closeBtn.style.opacity = "1"; // Button dikha do
      closeBtn.style.pointerEvents = "auto"; // Clicks chalu kar do
      clearInterval(checkWidgetLoaded); // Checker ko band kar do taaki memory waste na ho
    }
  }, 500);

  let isDragging = false;
  let hasMoved = false;
  let currentX = 0, currentY = 0;
  let initialX, initialY;

  let minX = 0, maxX = 0, minY = 0, maxY = 0;

  const onDragStart = (e) => {
    // Agar click close button par hua hai, toh drag start mat karo
    if (e.target === closeBtn) return;

    if (e.target.closest('#charla-drag-wrapper') || e.target.closest('charla-widget')) {
      isDragging = true;
      hasMoved = false;

      wrapper.style.transition = 'none';
      wrapper.style.cursor = 'grabbing';
      document.body.classList.add('charla-disable-selection');

      const screenWidth = document.documentElement.clientWidth;
      const screenHeight = document.documentElement.clientHeight;

      const rect = wrapper.getBoundingClientRect();
      const rectWidth = rect.width || 60;
      const rectHeight = rect.height || 60;

      maxX = 0;
      maxY = 0;

      minX = -(screenWidth - rectWidth - 30);
      minY = -(screenHeight - rectHeight - 60);

      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

      initialX = clientX - currentX;
      initialY = clientY - currentY;
    }
  };

  const onDrag = (e) => {
    if (!isDragging) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    let newX = clientX - initialX;
    let newY = clientY - initialY;

    if (Math.abs(newX - currentX) > 3 || Math.abs(newY - currentY) > 3) {
      hasMoved = true;
      wrapper.classList.add('charla-is-dragging');
      if (e.cancelable) e.preventDefault();
    }

    if (hasMoved) {
      currentX = Math.max(minX, Math.min(newX, maxX));
      currentY = Math.max(minY, Math.min(newY, maxY));

      wrapper.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    wrapper.style.cursor = 'grab';

    wrapper.classList.remove('charla-is-dragging');
    document.body.classList.remove('charla-disable-selection');

    if (!hasMoved) {
      wrapper.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      wrapper.style.transform = 'translate(0px, 0px)';
      currentX = 0;
      currentY = 0;
    } else {
      wrapper.style.transition = 'transform 0.3s ease';
    }
  };

  document.addEventListener('mousedown', onDragStart);
  document.addEventListener('touchstart', onDragStart, { passive: false });

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });

  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchend', onDragEnd);
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
