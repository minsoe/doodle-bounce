import { useSyncExternalStore, useCallback } from 'react';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('storage', callback);
  window.addEventListener('local-storage-sync', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('local-storage-sync', callback);
  };
}

export function setStorageItem(key: string, value: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value);
      window.dispatchEvent(new Event('local-storage-sync'));
    } catch {}
  }
}

export function useSavedNumber(
  key: string,
  fallback: number
): [number, (val: number | ((prev: number) => number)) => void] {
  const getSnapshot = () => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const num = parseInt(val, 10);
        if (!isNaN(num)) return num;
      }
      return fallback;
    } catch {
      return fallback;
    }
  };

  const getServerSnapshot = () => fallback;

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (val: number | ((prev: number) => number)) => {
      try {
        const raw = localStorage.getItem(key);
        const current = raw !== null ? parseInt(raw, 10) || fallback : fallback;
        const next = typeof val === 'function' ? val(current) : val;
        setStorageItem(key, next.toString());
      } catch {}
    },
    [key, fallback]
  );

  return [value, setValue];
}

export function useSavedString<T extends string>(
  key: string,
  fallback: T,
  validator?: (val: string) => val is T
): [T, (val: T) => void] {
  const getSnapshot = () => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        if (validator) {
          if (validator(val)) return val;
        } else {
          return val as T;
        }
      }
      return fallback;
    } catch {
      return fallback;
    }
  };

  const getServerSnapshot = () => fallback;

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (val: T) => {
      setStorageItem(key, val);
    },
    [key]
  );

  return [value, setValue];
}

export function useSavedBoolean(
  key: string,
  fallback: boolean
): [boolean, (val: boolean | ((prev: boolean) => boolean)) => void] {
  const getSnapshot = () => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        return val === 'true';
      }
      return fallback;
    } catch {
      return fallback;
    }
  };

  const getServerSnapshot = () => fallback;

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      try {
        const raw = localStorage.getItem(key);
        const current = raw !== null ? raw === 'true' : fallback;
        const next = typeof val === 'function' ? val(current) : val;
        setStorageItem(key, next.toString());
      } catch {}
    },
    [key, fallback]
  );

  return [value, setValue];
}
