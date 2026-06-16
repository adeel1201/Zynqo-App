"use client";

import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/zynqo/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Users, 
  Radio, 
  Navigation, 
  Shield, 
  Loader2, 
  ChevronRight,
  LocateFixed,
  Ghost
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Haversine formula for distance calculation in kilometers
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

export default function NearbyPage() {
  const { user, profile } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch users who haven't hidden their location
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('hideLocation', '==', false));
  }, [db]);
  const { data: allUsers = [], loading: usersLoading } = useCollection(usersQuery);

  // Fetch public channels
  const channelsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'channels'), where('type', '==', 'public'));
  }, [db]);
  const { data: channels = [], loading: channelsLoading } = useCollection(channelsQuery);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsUpdating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setError(null);
        
        // Update my location in Firestore if not in Ghost Mode
        if (user && db && !profile?.hideLocation) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              latitude,
              longitude,
              lastLocationUpdate: serverTimestamp()
            });
          } catch (err) {
            console.error("Failed to update location", err);
          }
        }
        setIsUpdating(false);
      },
      (err) => {
        setError("Location access denied. Please enable it in settings.");
        setIsUpdating(false);
      }
    );
  };

  useEffect(() => {
    if (!profile?.hideLocation) {
      requestLocation();
    }
  }, [profile?.hideLocation]);

  const nearbyUsers = useMemo(() => {
    if (!location) return [];
    return allUsers
      .filter((u: any) => u.uid !== user?.uid && u.latitude && u.longitude)
      .map((u: any) => ({
        ...u,
        distance: getDistance(location.lat, location.lng, u.latitude, u.longitude)
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [allUsers, location, user?.uid]);

  const nearbyChannels = useMemo(() => {
    if (!location) return [];
    return channels
      .filter((c: any) => c.latitude && c.longitude)
      .map((c: any) => ({
        ...c,
        distance: getDistance(location.lat, location.lng, c.latitude, c.longitude)
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [channels, location]);

  const isLoading = usersLoading || channelsLoading || isUpdating;

  if (profile?.hideLocation) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-24">
        <AppHeader title="Nearby" showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(159,95,245,0.1)]">
            <Ghost size={48} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-headline font-bold text-foreground">Ghost Mode Active</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              Your location is hidden from others. To see people and channels nearby, disable Ghost Mode in your profile settings.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/profile/edit')}
            className="rounded-2xl bg-primary px-8 text-white"
          >
            Update Privacy Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-fade-in bg-background min-h-screen pb-24">
      <AppHeader title="Nearby" showSearch={false} />

      <div className="p-4 space-y-8">
        {/* Radar Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative bg-card/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-border flex flex-col items-center text-center gap-6 shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 animate-ping rounded-full" />
              <div className="relative w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_40px_rgba(159,95,245,0.3)]">
                <Navigation size={32} className="animate-spin-slow" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-headline font-bold text-foreground">Discovery Radar</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Scanning your immediate vicinity</p>
            </div>

            {error ? (
              <div className="flex flex-col items-center gap-3">
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none px-4 py-1">
                  <Shield size={12} className="mr-2" /> {error}
                </Badge>
                <Button variant="ghost" size="sm" onClick={requestLocation} className="text-primary text-[10px] uppercase font-black">Retry Scan</Button>
              </div>
            ) : location ? (
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border">
                <LocateFixed size={14} className="text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Signal Locked</span>
              </div>
            ) : (
              <Loader2 className="animate-spin text-primary" size={24} />
            )}
          </div>
        </div>

        {/* Nearby People */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="font-headline font-bold text-lg text-foreground">People Nearby</h3>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="w-full h-20 rounded-2xl bg-muted animate-pulse" />)
            ) : nearbyUsers.length > 0 ? (
              nearbyUsers.map((u: any) => (
                <div 
                  key={u.uid}
                  onClick={() => router.push(`/users/${u.uid}`)}
                  className="flex items-center justify-between bg-card p-4 rounded-3xl border border-border hover:bg-muted transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl border border-primary/20">
                      <AvatarImage src={u.profilePhoto} />
                      <AvatarFallback className="bg-primary/5 text-primary">{u.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2 text-foreground">
                        {u.displayName}
                        {u.onlineStatus === 'online' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          {u.distance < 1 ? `${Math.round(u.distance * 1000)}m away` : `${u.distance.toFixed(1)}km away`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic bg-muted/20 rounded-[2.5rem] border border-dashed border-border">
                No users found within range.
              </div>
            )}
          </div>
        </section>

        {/* Nearby Channels */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-secondary" />
              <h3 className="font-headline font-bold text-lg text-foreground">Local Channels</h3>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              [1, 2].map(i => <div key={i} className="w-full h-20 rounded-2xl bg-muted animate-pulse" />)
            ) : nearbyChannels.length > 0 ? (
              nearbyChannels.map((c: any) => (
                <div 
                  key={c.id}
                  onClick={() => router.push(`/channels/${c.id}`)}
                  className="flex items-center justify-between bg-white p-4 rounded-3xl border border-border hover:bg-secondary/5 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl border border-secondary/20 bg-secondary/10">
                      <AvatarImage src={c.photo} />
                      <AvatarFallback className="text-secondary"><Radio size={20} /></AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{c.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{c.description}</p>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-1 block">
                        {c.distance < 1 ? `${Math.round(c.distance * 1000)}m away` : `${c.distance.toFixed(1)}km away`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-secondary/30 group-hover:text-secondary transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic bg-muted/20 rounded-[2.5rem] border border-dashed border-border">
                No active public channels nearby.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}