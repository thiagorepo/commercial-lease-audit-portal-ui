import { useState, useEffect, useCallback, useRef } from 'react';

/* -------------------------------------------------------------------------- */

interface ServiceCallState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Why: Every data-fetching call site repeats the same loading/error/data pattern.
 *      Centralising it reduces duplication and guarantees consistent UX across the app.
 * What: Hook that executes an async function, tracks loading/error/data state,
 *       and re-fetches when dependencies change. Returns a stable `refetch` callback
 *       for manual retries.
 * Test: Pass a resolving async fn, assert data is set and loading is false.
 *       Pass a rejecting fn, assert error is set. Change deps, assert refetch fires.
 */
export function useServiceCall<T>(
  fn: () => Promise<T>,
  deps: unknown[],
): ServiceCallState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep a stable reference to the latest function so the refetch callback
  // always calls the current version without adding it to the effect deps.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fnRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- deps are tracked below via the effect

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  useEffect(() => {
    const cancel = execute();
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls re-fetch cadence via deps
  }, deps);

  return { data, loading, error, refetch };
}
