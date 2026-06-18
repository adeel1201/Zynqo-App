"use client";

/**
 * @fileOverview Zynqo Real-time Firebase Hooks
 * Provides a unified, real-time interface for all Firebase operations.
 * This file handles real-time syncing for messages, channels, and moments.
 */

import { 
  useFirestore as useFirebaseFirestore, 
  useStorage as useFirebaseStorage, 
  useAuth as useFirebaseAuth,
  useCollection as useFirebaseCollection,
  useDoc as useFirebaseDoc,
  useMemoFirebase
} from '@/firebase';
import { DocumentData, Query, DocumentReference } from 'firebase/firestore';

export function useFirestore() {
  const db = useFirebaseFirestore();
  if (!db) console.warn("Firestore not initialized yet.");
  return db;
}

export function useStorage() {
  const storage = useFirebaseStorage();
  if (!storage) console.warn("Firebase Storage not initialized yet.");
  return storage;
}

export function useAuth() {
  return useFirebaseAuth();
}

/**
 * Real-time collection hook using onSnapshot.
 */
export function useCollection<T = DocumentData>(q: Query<T> | null) {
  return useFirebaseCollection<T>(q);
}

/**
 * Real-time document hook using onSnapshot.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  return useFirebaseDoc<T>(ref);
}

export { useMemoFirebase };
