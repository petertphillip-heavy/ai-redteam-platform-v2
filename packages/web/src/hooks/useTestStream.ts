import { useState, useEffect, useCallback, useRef } from 'react';
import type { TestStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

export interface TestProgress {
  completedPayloads: number;
  totalPayloads: number;
  successfulAttacks: number;
  status: TestStatus;
  currentPayload?: string;
  errors?: string[];
}

interface UseTestStreamReturn {
  progress: TestProgress | null;
  status: TestStatus | null;
  error: string | null;
  isConnected: boolean;
  reconnect: () => void;
}

interface UseTestStreamOptions {
  enabled?: boolean;
  onComplete?: (progress: TestProgress) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for connecting to SSE endpoint for real-time test progress updates
 */
export function useTestStream(
  testId: string | null,
  options: UseTestStreamOptions = {}
): UseTestStreamReturn {
  const { enabled = true, onComplete, onError } = options;

  const [progress, setProgress] = useState<TestProgress | null>(null);
  const [status, setStatus] = useState<TestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!testId || !enabled) {
      return;
    }

    // Clean up existing connection
    cleanup();

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError('Authentication required');
      return;
    }

    // EventSource doesn't support custom headers, so we pass token as query param
    // The backend should accept this for SSE endpoints
    const url = `${API_BASE_URL}/api/tests/${testId}/stream?token=${encodeURIComponent(token)}`;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.addEventListener('connected', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE connected:', data);
        } catch (e) {
          console.error('Failed to parse connected event:', e);
        }
      });

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        try {
          const data: TestProgress = JSON.parse(event.data);
          setProgress(data);
          setStatus(data.status);
        } catch (e) {
          console.error('Failed to parse progress event:', e);
        }
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        try {
          const data: TestProgress = JSON.parse(event.data);
          setProgress(data);
          setStatus(data.status);

          // Notify completion callback
          if (onComplete) {
            onComplete(data);
          }

          // Close connection on completion
          cleanup();
        } catch (e) {
          console.error('Failed to parse complete event:', e);
        }
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const errorMessage = data.message || 'Unknown error';
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
        } catch (e) {
          // General connection error, not a custom error event
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);

        // Don't reconnect if we've exceeded max attempts
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Connection lost. Max reconnection attempts reached.');
          cleanup();
          return;
        }

        // Exponential backoff for reconnection
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (e) {
      setError('Failed to establish SSE connection');
      console.error('SSE connection error:', e);
    }
  }, [testId, enabled, cleanup, onComplete, onError]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setError(null);
    connect();
  }, [connect]);

  // Connect when testId changes or enabled status changes
  useEffect(() => {
    if (testId && enabled) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [testId, enabled, connect, cleanup]);

  // Reset state when testId changes
  useEffect(() => {
    setProgress(null);
    setStatus(null);
    setError(null);
  }, [testId]);

  return {
    progress,
    status,
    error,
    isConnected,
    reconnect,
  };
}

export default useTestStream;
