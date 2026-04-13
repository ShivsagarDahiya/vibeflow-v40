import { useCallback, useEffect, useRef, useState } from "react";

/**
 * usePolling — runs `fn` every `intervalMs` while component is mounted.
 * Stops when `enabled` is false. Returns the latest value and loading state.
 */
export function usePolling<T>(
  fn: () => Promise<T>,
  intervalMs: number,
  enabled: boolean = true
): { data: T | null; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
    } catch {
      // ignore poll errors silently
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    run().finally(() => setLoading(false));
    timerRef.current = setInterval(run, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, intervalMs, run]);

  return { data, loading, refresh: run };
}
