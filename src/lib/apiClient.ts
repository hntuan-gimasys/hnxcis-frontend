/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { API_BASE_URL } from '../config/runtime';

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Attaches the Firebase ID token when a user is signed in. The backend accepts
 * anonymous calls while AUTH_REQUIRED=false, and rejects them once it is on.
 */
async function buildAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    // Firebase not configured / not signed in — call the API anonymously.
    return {};
  }
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authHeaders = await buildAuthHeaders();

  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  const rawBody = await response.text();
  let body: any = undefined;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && (body.error || body.message)) ||
      `Yêu cầu thất bại (HTTP ${response.status})`;
    throw new ApiError(String(message), response.status, body);
  }

  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) });
}
