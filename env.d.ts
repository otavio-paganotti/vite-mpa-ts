/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ROUTER_BASE: string;
  readonly VITE_APP_NAMES: string;
  readonly VITE_APP_EXTENSIONS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
