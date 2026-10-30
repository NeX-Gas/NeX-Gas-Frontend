"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Penyimpanan lokal tanpa backend.
 *
 * Dibaca lewat `useSyncExternalStore` supaya:
 * - server/HTML awal tetap memakai nilai default (tidak ada hydration mismatch),
 * - setelah mount React langsung memakai nilai dari localStorage,
 * - tab lain yang mengubah data ikut tersinkron.
 */

const PREFIX = "nexgas:";

type Listener = () => void;

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();
let storageBound = false;

function readValue<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    const value = raw === null ? fallback : (JSON.parse(raw) as T);
    cache.set(key, value);
    return value;
  } catch {
    return fallback;
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function bindStorageEvents() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (!event.key || !event.key.startsWith(PREFIX)) return;
    const key = event.key.slice(PREFIX.length);
    cache.delete(key);
    emit(key);
  });
}

function subscribeStored(key: string, listener: Listener) {
  bindStorageEvents();
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
  };
}

function writeValue<T>(key: string, value: T) {
  cache.set(key, value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // kuota penuh / storage diblokir -> data tetap hidup di memori
    }
  }
  emit(key);
}

/** State React yang otomatis disimpan ke localStorage. */
export function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (listener) => subscribeStored(key, listener),
    () => readValue(key, fallback),
    () => fallback,
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = readValue(key, fallback);
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      writeValue(key, resolved);
    },
    [key, fallback],
  );

  return [value, setValue];
}
