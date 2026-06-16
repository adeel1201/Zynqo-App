
'use client';

import { useState, useEffect } from 'react';
import { Query, onSnapshot, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';
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
    // Extract path for context
    let path = 'collection_query';
    try {
      // Improved path extraction for standard Query and CollectionReference
      path = (q as any)._query?.path?.segments?.join('/') || (q as any).path || 'collection_query';
    } catch (e) {}

    // Guard: Wait for both the query and a truly authenticated user session.
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
        // Only emit permission error if we actually have a user, 
        // otherwise it's just a transient auth transition state.
        if (auth?.currentUser && serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [q, auth?.currentUser?.uid]);

  return { data, loading };
}
