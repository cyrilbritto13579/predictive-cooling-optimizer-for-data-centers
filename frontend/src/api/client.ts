// SPDX-License-Identifier: MIT
import { env } from '../config/environment';
import type { ErrorResponse } from '../types';

export class ApiError extends Error {
  public statusCode: number;
  public errorType: string;
  public detail: string;

  constructor(statusCode: number, detail: string, errorType: string = 'ApiError') {
    super(detail);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.detail = detail;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Safely construct an absolute API endpoint URL without duplicate slashes.
 */
export function buildApiUrl(baseUrl: string, endpoint: string): string {
  const cleanBase = (baseUrl || '').trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 30000, ...fetchOptions } = options;

  const url = buildApiUrl(env.apiBaseUrl, endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}: ${response.statusText}`;
      let errorType = 'HttpError';

      try {
        const errorJson = (await response.json()) as ErrorResponse;
        if (errorJson.detail) {
          detail = errorJson.detail;
        }
        if (errorJson.error_type) {
          errorType = errorJson.error_type;
        }
      } catch {
        // Fallback to text status
      }

      throw new ApiError(response.status, detail, errorType);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out waiting for backend server response.', 'TimeoutError');
    }
    const message = error instanceof Error ? error.message : 'Network error or backend unreachable';
    throw new ApiError(0, message, 'NetworkError');
  } finally {
    clearTimeout(timeoutId);
  }
}
