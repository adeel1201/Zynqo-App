
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
    // Attempt to extract the path for debugging
    let path = 'unknown_query';
    try {
      // Access internal path segments if available (reliable for both Ref and Query)
      path = (q as any).path || (q as any)._query?.path?.segments?.join('/') || 'unknown_query';
    } catch (e) {}

    // Debugging logs to pinpoint auth race conditions
    console.log(`[Firestore Query] useCollection sub:`, {
      path,
      currentUserUid: auth?.currentUser?.uid || 'NONE',
      authCurrentUserExists: !!auth?.currentUser
    });

    // Guard: Do not initiate a subscription if there is no query or NO authenticated user.
    // This prevents "Missing or insufficient permissions" during the auth handshake.
    if (!q || !auth?.currentUser) {
      if (!q) setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[Firestore Query] Success: ${path}`);
        const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
        setData(results);
        setLoading(false);
      },
      async (serverError) => {
        console.error(`[Firestore Query] FAILED: ${serverError.message}`, { path });

        // Only emit permission error if we actually have a user, 
        // otherwise it's just a transient auth transition state.
        if (auth?.currentUser) {
          const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [q, auth?.currentUser?.uid]); // Re-run when query or auth state changes

  return { data, loading };
}
