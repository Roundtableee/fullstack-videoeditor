import { useEffect, useCallback, useState } from "react";

/**
 * useExportStatus
 * Polls a given API endpoint for export status at a set interval.
 * When status is 'complete', triggers onComplete callback and stops polling.
 *
 * @param {string} url - The API endpoint to poll
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {(data: any) => boolean} isComplete - Function to check if export is complete
 * @param {() => void} onComplete - Callback when export is complete
 */
export function useExportStatus({
  url,
  intervalMs = 30000,
  isComplete = (data) => data.status === 'complete',
  onComplete,
}: {
  url: string;
  intervalMs?: number;
  isComplete?: (data: any) => boolean;
  onComplete: () => void;
}) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let interval: NodeJS.Timeout;
    async function poll() {
      setLoading(true);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch export status');
        const data = await res.json();
        setStatus(data);
        if (isComplete(data)) {
          onComplete();
          stopped = true;
          clearInterval(interval);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    poll();
    interval = setInterval(() => {
      if (!stopped) poll();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [url, intervalMs, isComplete, onComplete]);

  return { status, loading, error };
}
