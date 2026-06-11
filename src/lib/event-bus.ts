/**
 * Why: Decouples event producers from consumers so services can emit events
 *      without knowing who listens (e.g., export completed -> notification, analytics).
 * What: Simple typed pub/sub using a Map of event names to listener sets.
 * Test: Subscribe to an event, emit it, assert callback received the payload.
 */

type Listener<T = unknown> = (payload: T) => void;

const listeners = new Map<string, Set<Listener>>();

export const eventBus = {
  on<T = unknown>(event: string, fn: Listener<T>): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    const set = listeners.get(event)!;
    set.add(fn as Listener);
    return () => {
      set.delete(fn as Listener);
      if (set.size === 0) listeners.delete(event);
    };
  },

  emit<T = unknown>(event: string, payload: T): void {
    listeners.get(event)?.forEach((fn) => fn(payload));
  },

  /** Remove all listeners. Useful in tests. */
  clear(): void {
    listeners.clear();
  },
};
