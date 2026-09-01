import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const readableMessages: Record<string, string> = {
  'Authentication required': 'Please log in to continue.',
  'Invalid token': 'Your session has expired. Please log in again.',
  'User not found': 'Your account could not be found. Please log in again.',
  'Access denied': 'You do not have permission to perform this action.',
  'Tournament not found': 'The tournament could not be found.',
  'Already registered': 'You are already registered for this tournament.',
  'Tournament full': 'This tournament is full.',
  'Tournament registration has ended': 'Registration for this tournament is closed.',
  'Tournament registration has not started yet': 'Registration for this tournament has not started yet.',
  'Tournament has already started': 'This tournament has already started.',
  'Only participants can join a tournament': 'Only participants can register for tournaments.',
  'Server error': 'Something went wrong on the server. Please try again.',
  'Something went wrong': 'Something went wrong on the server. Please try again.',
};

export const normalizeApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Array<{ message?: string }>; error?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      const normalized = readableMessages[data.message] || data.message;
      return normalized;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const message = data.errors
        .map((item) => item.message)
        .filter(Boolean)
        .join(', ');
      return message || 'The request could not be processed. Please check your input.';
    }

    if (typeof data?.error === 'string' && data.error.trim()) {
      return readableMessages[data.error] || data.error;
    }

    const status = error.response?.status;
    if (status === 400) return 'The request could not be processed. Please check your input.';
    if (status === 401) return 'Please log in to continue.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'The requested tournament or resource could not be found.';
    if (status === 409) return 'This action conflicts with the current state. Please review and try again.';
    if (status && status >= 500) return 'Something went wrong on the server. Please try again.';
  }

  if (error instanceof Error && error.message) {
    return readableMessages[error.message] || error.message;
  }

  return 'Something went wrong. Please try again.';
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('code-arena-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('code-arena-token');
      localStorage.removeItem('code-arena-user');
      window.location.href = '/login';
    }

    return Promise.reject(new Error(normalizeApiError(error)));
  }
);

// Export services
export * from './authApi';
export * from './tournamentApi';
export * from './contestApi';
export * from './adminApi';

export default apiClient;
