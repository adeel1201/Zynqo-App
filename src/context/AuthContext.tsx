"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const auth = useFirebaseAuth();
  const db = useFirestore();
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user || !db) return;

    const userRef = doc(db, 'users', user.uid);
    
    updateDoc(userRef, {
      onlineStatus: 'online',
      lastSeen: serverTimestamp()
    }).catch(() => {});

    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'away';
      updateDoc(userRef, { 
        onlineStatus: status,
        lastSeen: serverTimestamp()
      }).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, db]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    if (!auth || !db) {
      if (!auth) setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (authUser && db) {
        const docRef = doc(db, "users", authUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, () => {
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [auth, db]);

  // Handle auth-based redirection strictly on the client
  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/welcome', '/login', '/signup', '/forgot-password'];
      const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

      if (!user && !isPublicPath) {
        router.push('/welcome');
      } else if (user && isPublicPath) {
        router.push('/chats');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
