'use client';

import { useState, useEffect } from 'react';
import { DocumentReference, onSnapshot, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useAuth } from '../provider';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    // Guard: Ensure we have a ref and the Auth SDK has initialized the currentUser
    // to avoid unauthenticated requests during the transition state.
    if (!ref || !auth?.currentUser) {
      if (!ref) setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        setData(doc.exists() ? { id: doc.id, ...doc.data() } as any : null);
        setLoading(false);
      },
      async (error) => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [ref?.path, auth?.currentUser?.uid]);

  return { data, loading };
}
