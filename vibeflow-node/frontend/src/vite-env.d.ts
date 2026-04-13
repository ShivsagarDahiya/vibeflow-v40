/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CANISTER_ID_VIBEFLOW_NODE_BACKEND: string;
  readonly VITE_II_CANISTER_ID: string;
  readonly VITE_API_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
