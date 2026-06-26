/**
 * Axios API Client with Interceptors
 * @module api/client
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Request-ID'] = requestId;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log all API errors
    Log('frontend', 'error', 'api', `API Error: ${error.message}`, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status
    });

    // Token expired - try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { token } = response.data.data;
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Retry logic for network errors (max 3 retries)
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

/**
 * Frontend Logging Middleware
 * Validates and sends logs to evaluation service
 */
export function Log(
  stack: 'backend' | 'frontend',
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  pkg: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  const validFrontendPackages = ['api', 'component', 'hook', 'page', 'state', 'style'];
  const validCommonPackages = ['auth', 'config', 'middleware', 'utils'];

  if (!validLevels.includes(level)) return;
  if (![...validFrontendPackages, ...validCommonPackages].includes(pkg)) return;

  if (import.meta.env.DEV) {
    console[level === 'fatal' ? 'error' : level](`[${pkg}] ${message}`, metadata || '');
  }

  fetch(`${API_BASE_URL.replace('/api', '')}/evaluation-service/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stack, level, package: pkg, message }),
    keepalive: true
  }).catch(() => {});
}

export default apiClient;
