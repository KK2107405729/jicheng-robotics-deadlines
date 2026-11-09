import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private mode; the UI still works in-memory.
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return;
      try {
        setValue(JSON.parse(event.newValue) as T);
      } catch {
        // Ignore malformed cross-tab values.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue] as const;
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
