"use client";

import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/zynqo/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Users,
  Navigation,
  Loader2,
  ChevronRight,
  LocateFixed
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const db = getFirestore();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' ||!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setIsUpdating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setError(null);
        if (user && db &&!profile?.hideLocation) {
          updateDoc(doc(db, 'users', user.uid), {
            latitude, longitude, lastLocationUpdate: serverTimestamp()
          }).catch(console.error);
        }
        setIsUpdating(false);
      },
      () => {
        setError("Location access denied");
        setIsUpdating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!profile?.hideLocation) {
      requestLocation();
    }
  }, [profile?.hideLocation]);

  // Users fetch - Vercel safe
  useEffect(() => {
    if (!db) return;

    setUsersLoading(true);
    const q = query(collection(db, 'users'), where('hideLocation', '==', false));

    getDocs(q).then(snap => {
      const users = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setAllUsers(users);
      setUsersLoading(false);
    }).catch(err => {
      console.error('Fetch users error:', err);
      setUsersLoading(false);
    });
  }, [db]);

  const nearbyUsers = useMemo(() => {
    if (!location ||!user) return [];
    return allUsers
     .filter((u: any) => u.uid!== user.uid && u.latitude && u.longitude)
     .map((u: any) => ({
       ...u,
        distance: getDistance(location.lat, location.lng, u.latitude, u.longitude)
      }))
     .sort((a, b) => a.distance - b.distance)
     .slice(0, 20); // Top 20 only
  }, [allUsers, location, user?.uid]);

  const isLoading = usersLoading || isUpdating;

  return (
    <div className="flex flex-col animate-fade-in bg-background min-h-screen pb-24">
      <AppHeader title="Nearby" showSearch={false} />

      <div className="p-4 space-y-8">
        <div className="relative bg-card/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border-border flex-col items-center text-center gap-6 shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 animate-ping rounded-full" />
            <div className="relative w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Navigation size={32} className="animate-spin-slow" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground">Discovery Radar</h2>
          {error? (
            <Badge variant="destructive">{error}</Badge>
          ) : location? (
            <div className="flex items-center gap-2 text-primary">
              <LocateFixed />
              <span className="text-xs">Location active</span>
            </div>
          ) : (
            <Loader2 className="animate-spin text-primary" />
          )}
        </div>

        <section className="space-y-4">
          <h3 className="font-bold text-lg px-2 flex items-center gap-2">
            <Users size={16} className="text-primary" />
            People Nearby
          </h3>

          <div className="flex flex-col gap-3">
            {isLoading? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : nearbyUsers.length === 0? (
              <div className="text-center py-8">
                <MapPin size={40} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No users nearby</p>
              </div>
            ) : (
              nearbyUsers.map((u: any) => (
                <div
                  key={u.uid}
                  onClick={() => router.push(`/users/${u.uid}`)}
                  className="flex items-center justify-between bg-card p-4 rounded-3xl border-border hover:bg-muted transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.profilePhoto} />
                      <AvatarFallback>{u.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm">{u.displayName || 'User'}</h4>
                      <span className="text-[10px] text-primary font-bold">
                        {u.distance.toFixed(1)}km away
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}