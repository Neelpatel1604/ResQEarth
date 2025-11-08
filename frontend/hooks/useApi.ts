/**
 * React hook for making API calls to the backend.
 */
import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | void>;
  reset: () => void;
}

export function useApi<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await apiCall(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Convenience hooks for common API operations
export function useHealthCheck() {
  return useApi(() => api.get<{ status: string; timestamp: string }>('/api/health'));
}

export function useDisasters() {
  return useApi(() => api.get<{ disasters: unknown[]; total: number }>('/api/disasters'));
}

export function useDisaster(id: string) {
  return useApi(() => api.get(`/api/disasters/${id}`));
}

export function usePreventionPlan() {
  return useApi((data: unknown) => api.post('/api/prevention/calculate', data));
}

export function useSimulation() {
  return useApi((data: unknown) => api.post('/api/prevention/simulate', data));
}

