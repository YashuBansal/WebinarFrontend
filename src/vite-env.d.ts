/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_APP_WORKING_ENVIRONMENT: string;
  readonly VITE_REACT_APP_API_BASE_URL_DEVELOPMENT: string;
  readonly VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION: string;
  readonly VITE_REACT_APP_META_APP_ID: string;
  readonly VITE_REACT_APP_META_CONFIG_ID: string;
  readonly VITE_GRAPH_API_VERSION: string;
  readonly VITE_REACT_APP_DASHBOARD_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
