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
  </Provider>,
);
