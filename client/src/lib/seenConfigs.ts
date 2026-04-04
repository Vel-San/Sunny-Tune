/** Tracks which config cards the user has "seen" (dismissed neon indicators). */

import { useEffect, useState } from "react";

const KEY = "st_seen_configs";
const CLEAR_EVENT = "st-seen-clear-all";

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function isSeen(id: string): boolean {
  return readSet().has(id);
}

export function markSeen(id: string): void {
  const s = readSet();
  if (s.has(id)) return;
  s.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    // storage quota exceeded or disabled — silently ignore
  }
}

/**
 * Broadcasts a "clear all" event so every mounted card immediately hides its
 * indicator. Each card also persists its own seen state to localStorage via
 * the hook handler, so badges stay dismissed after a page refresh.
 */
export function clearAllSeen(): void {
  window.dispatchEvent(new Event(CLEAR_EVENT));
}

/**
 * React hook — returns `[seen, markThisSeen]`.
 * Automatically sets `seen = true` when `clearAllSeen()` is called anywhere
 * in the app, so all mounted cards dismiss their indicators immediately and
 * persist that state to localStorage so they stay dismissed after a reload.
 */
export function useConfigSeen(id: string): [boolean, () => void] {
  const [seen, setSeen] = useState(() => isSeen(id));

  useEffect(() => {
    const handler = () => {
      markSeen(id); // persist to localStorage so it survives a reload
      setSeen(true);
    };
    window.addEventListener(CLEAR_EVENT, handler);
    return () => window.removeEventListener(CLEAR_EVENT, handler);
  }, [id]);

  const mark = () => {
    markSeen(id);
    setSeen(true);
  };

  return [seen, mark];
}
