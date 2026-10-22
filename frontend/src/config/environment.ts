// SPDX-License-Identifier: MIT
/**
 * Application environment configuration.
 * Configurable via Vite environment variables.
 */

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  githubUrl: 'https://github.com/vk22006/predictive-cooling-optimizer-for-data-centers',
  appName: 'Predictive Cooling Optimizer',
  version: '1.0.0',
} as const;
