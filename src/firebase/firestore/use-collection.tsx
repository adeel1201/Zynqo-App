'use client';

import { useState, useEffect } from 'react';
import { Query, onSnapshot, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useAuth } from '../provider';

/**
 * Custom hook to subscribe to a Firestore collection query.
 * @param q The Firestore Query object or null.
 * @returns An object containing the collection data and loading state.
 */
export function useCollection<T = DocumentData>(q: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    // Guard: Ensure we have a query and that the Auth SDK is actually ready with a user
    // to prevent the race condition where Firestore sends an unauthenticated request
    // just as the component re-renders with the user object from context.
    if (!q || !auth?.currentUser) {
      if (!q) setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
        setData(results);
        setLoading(false);
      },
      async (serverError) => {
        // Improved path extraction for Query objects to help with debugging
        let path = 'collection_query';
        try {
          if ((q as any).path) {
            path = (q as any).path;
          } else if ((q as any)._query?.path?.segments) {
            path = (q as any)._query.path.segments.join('/');
          } else if ((q as any).endpoint?.path?.segments) {
            path = (q as any).endpoint.path.segments.join('/');
          }
        } catch (e) {
          // Path resolution failed
        }
        
        const permissionError = new FirestorePermissionError({
          path: path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [q, auth?.currentUser?.uid]); // Re-run if query changes or internal auth state updates

  return { data, loading };
}
