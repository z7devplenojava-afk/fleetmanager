// Configuration file for environment variables
export const config = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'https://ci.z7botsolutions.com.br/api',
  
  // Authentication
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY || 'token',
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken',
  USER_KEY: import.meta.env.VITE_USER_KEY || 'user',
  
  // reCAPTCHA Configuration
  RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'SecuredGuard',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const; 