"use client";

import { useEffect, useState, useRef } from 'react';
import { getFirestore, Firestore, collection, query, Query, onSnapshot, DocumentReference, DocumentData, getDoc } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth, onAuthStateChanged, User } from 'firebase/auth';

/**
 * Returns Firestore instance - Vercel safe
 */
export function useFirestore(): Firestore {
  return getFirestore();
}

/**
 * Returns Storage instance
 */
export function useStorage(): FirebaseStorage {
  return getStorage();
}

/**
 * Returns Auth + current user
 */
export function useFirebaseAuth(): { user: User | null; auth: Auth; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(); // ← auth instance yahan ban gaya

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  return { user, auth, loading }; // ← FIX: ab auth bhi return ho raha hai
}

/**
 * Real-time collection hook using onSnapshot
 */
export function useCollection<T = DocumentData>(q: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() } as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error('useCollection error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [q]);

  return { data, loading, error };
}

/**
 * Real-time document hook using onSnapshot
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id,...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('useDoc error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [ref]);

  return { data, loading, error };
}

/**
 * Stabilizes a Firebase query or reference
 * Vercel safe - null deps ko handle karta hai
 */
export function useMemoFirebase<T>(factory: () => T | null, deps: any[]): T | null {
  const ref = useRef<T | null>(null);
  const depsRef = useRef<any[]>([]);

  const allDepsValid = deps.every(dep => dep!== null && dep!== undefined);
  const changed = deps.length!== depsRef.current.length || deps.some((dep, i) => dep!== depsRef.current[i]);

  if (allDepsValid && (changed || ref.current === null)) {
    ref.current = factory();
    depsRef.current = deps;
  }

  return ref.current;
}