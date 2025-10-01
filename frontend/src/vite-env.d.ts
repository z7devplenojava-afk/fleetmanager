/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_TOKEN_KEY: string
  readonly VITE_REFRESH_TOKEN_KEY: string
  readonly VITE_USER_KEY: string
  readonly VITE_RECAPTCHA_SITE_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
