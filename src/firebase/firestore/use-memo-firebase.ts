'use client';

import { useRef } from 'react';

/**
 * A hook to stabilize a Firestore reference or query.
 * Vercel safe version - never returns undefined/null on first render if last value exists.
 */
export function useMemoFirebase<T>(factory: () => T | null, deps: any[]): T | null {
  const ref = useRef<T | null>(null);
  const depsRef = useRef<any[]>([]);

  const changed =
    deps.length!== depsRef.current.length ||
    deps.some((dep, i) => dep!== depsRef.current[i]);

  // Sirf tab naya ref banao jab saari dependencies valid hon
  const allDepsValid = deps.every(dep => dep!== null && dep!== undefined);

  if (allDepsValid && (changed || ref.current === null)) {
    ref.current = factory();
    depsRef.current = deps;
  }

  return ref.current;
}