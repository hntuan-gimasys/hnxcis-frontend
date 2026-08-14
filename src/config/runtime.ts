/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Runtime configuration for the frontend.
 *
 * Resolution order:
 *  1. `window.__APP_CONFIG__` — injected by /env.js, regenerated on every
 *     container start. This is what production (Cloud Run) uses, so the backend
 *     URL can be changed with `gcloud run services update` instead of a rebuild.
 *  2. Vite build-time env (`VITE_API_BASE_URL`) — handy for static hosting.
 *  3. Empty string — same-origin requests, proxied by the Vite dev server.
 */
export interface AppRuntimeConfig {
  API_BASE_URL: string;
  APP_ENV: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppRuntimeConfig>;
  }
}

const runtime: Partial<AppRuntimeConfig> =
  typeof window !== 'undefined' && window.__APP_CONFIG__ ? window.__APP_CONFIG__ : {};

function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return '';
  // Placeholders left untouched by envsubst should be treated as "not set".
  if (value.startsWith('${') || value === 'undefined' || value === 'null') return '';
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(
  runtime.API_BASE_URL || (import.meta.env.VITE_API_BASE_URL as string | undefined),
);

export const APP_ENV =
  runtime.APP_ENV || (import.meta.env.VITE_APP_ENV as string | undefined) || import.meta.env.MODE;

export const IS_PRODUCTION = APP_ENV === 'production';
