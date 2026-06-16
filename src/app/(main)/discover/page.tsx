"use client";

import { useState, useMemo, useEffect } from 'react';
import { AppHeader } from '@/components/zynqo/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Users, 
  Compass, 
  Zap, 
  Search, 
  Radio, 
  Heart, 
  Sparkles, 
  Loader2, 
  TrendingUp,
  MessageSquare,
  Navigation,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
  return R * c;
}

export default function DiscoverPage() {
  const { user, profile } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch Public Channels
  const channelsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'channels'), where('type', '==', 'public'), limit(10));
  }, [db]);
  const { data: channels = [], loading: channelsLoading } = useCollection(channelsQuery);

  // Fetch Newest Moments
  const momentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'moments'), orderBy('createdAt', 'desc'), limit(10));
  }, [db]);
  const { data: moments = [], loading: momentsLoading } = useCollection(momentsQuery);

  // Fetch Global Users for Suggestions & Nearby
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('hideLocation', '==', false), limit(20));
  }, [db]);
  const { data: allUsers = [], loading: usersLoading } = useCollection(usersQuery);

  // Get user location for nearby logic
  useEffect(() => {
    if (!profile?.hideLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
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
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [allUsers, location, user?.uid]);

  const trendingChannels = useMemo(() => {
    return [...channels].sort((a: any, b: any) => (b.followerIds?.length || 0) - (a.followerIds?.length || 0)).slice(0, 5);
  }, [channels]);

  const trendingMoments = useMemo(() => {
    return [...moments].sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 4);
  }, [moments]);

  const suggestedUsers = useMemo(() => {
    return allUsers.filter((u: any) => u.uid !== user?.uid).slice(0, 5);
  }, [allUsers, user?.uid]);

  const isLoading = channelsLoading || momentsLoading || usersLoading;

  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12] min-h-screen pb-32">
      <AppHeader title="Discover" showSearch={false} />
      
      <div className="p-4 space-y-8">
        {/* Radar & Search Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all" />
          <div className="relative bg-card/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full" />
              <div className="relative w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(159,95,245,0.3)]">
                <Navigation size={32} className="animate-spin-slow" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-headline font-bold">Zynqo Radar</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Scanning for social energy nearby</p>
            </div>
            
            <div className="w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search universe..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl focus-visible:ring-primary text-sm shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Nearby Pulse (New) */}
        {nearbyUsers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-secondary" />
                <h3 className="font-headline font-bold text-lg">Near You</h3>
              </div>
              <Button variant="link" onClick={() => router.push('/nearby')} className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto">Radar</Button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
              {nearbyUsers.map((u: any) => (
                <div 
                  key={u.uid}
                  onClick={() => router.push(`/users/${u.uid}`)}
                  className="min-w-[140px] bg-card/30 border border-white/5 p-4 rounded-[2rem] flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="relative">
                    <Avatar className="w-16 h-16 rounded-2xl border-2 border-secondary/20 p-1">
                      <AvatarImage src={u.profilePhoto} />
                      <AvatarFallback>{u.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0E0C12] rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs truncate">{u.displayName}</h4>
                    <span className="text-[8px] font-black text-secondary uppercase tracking-tighter">
                      {u.distance < 1 ? `${Math.round(u.distance * 1000)}m` : `${u.distance.toFixed(1)}km`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Channels */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="font-headline font-bold text-lg">Trending Channels</h3>
            </div>
            <Button variant="link" onClick={() => router.push('/channels')} className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto">View All</Button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="min-w-[220px] h-32 rounded-3xl bg-white/5 animate-pulse" />)
            ) : trendingChannels.length > 0 ? (
              trendingChannels.map((channel: any) => (
                <div 
                  key={channel.id}
                  onClick={() => router.push(`/channels/${channel.id}`)}
                  className="min-w-[240px] bg-card/60 border border-white/5 p-4 rounded-3xl flex flex-col gap-3 hover:bg-white/5 transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-2xl border border-primary/20 bg-primary/5">
                      <AvatarImage src={channel.photo} />
                      <AvatarFallback><Radio size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{channel.name}</h4>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase">
                        <Users size={10} />
                        <span>{channel.followerIds?.length || 0} Followers</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed opacity-80">{channel.description || 'Join our broadcast channel'}</p>
                </div>
              ))
            ) : (
              <div className="w-full py-8 text-center text-xs text-muted-foreground">No channels found yet.</div>
            )}
          </div>
        </section>

        {/* Suggested People */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" />
              <h3 className="font-headline font-bold text-lg">People to Follow</h3>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="w-full h-16 rounded-2xl bg-white/5 animate-pulse" />)
            ) : suggestedUsers.map((u: any) => (
              <div key={u.uid} className="flex items-center justify-between bg-card/30 p-3 rounded-2xl border border-white/5 shadow-sm group hover:bg-white/5 transition-all">
                <div 
                  className="flex items-center gap-3 cursor-pointer" 
                  onClick={() => router.push(`/users/${u.uid}`)}
                >
                  <Avatar className="h-12 w-12 rounded-xl border border-white/10 group-hover:border-primary/20 transition-all">
                    <AvatarImage src={u.profilePhoto} />
                    <AvatarFallback>{u.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{u.displayName}</h4>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      <AtSign size={8} className="opacity-50" />
                      <span>{u.username}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => router.push(`/users/${u.uid}`)}
                  className="rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-white h-8 px-4 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Visit
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Moments (Moments Style Feed Integration) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-secondary" />
              <h3 className="font-headline font-bold text-lg">Moment Pulse</h3>
            </div>
            <Button variant="link" onClick={() => router.push('/moments')} className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto">Full Feed</Button>
          </div>

          <div className="flex flex-col gap-6">
            {isLoading ? (
              [1, 2].map(i => <div key={i} className="aspect-video rounded-[2.5rem] bg-white/5 animate-pulse" />)
            ) : trendingMoments.map((moment: any) => (
              <div 
                key={moment.id}
                onClick={() => router.push('/moments')}
                className="bg-card/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group cursor-pointer hover:border-primary/20 transition-all"
              >
                {/* Moment Header */}
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="w-8 h-8 rounded-lg border border-white/10">
                    <AvatarImage src={moment.userPhoto} />
                    <AvatarFallback>{moment.userName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-bold truncate">{moment.userName}</h5>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">
                      {moment.createdAt?.toDate ? formatDistanceToNow(moment.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                    </p>
                  </div>
                  <Heart size={14} className="text-primary/40 group-hover:text-red-500 transition-colors" />
                </div>

                {/* Moment Media */}
                <div className="relative aspect-video bg-black/20">
                  {moment.imageUrl ? (
                    <Image 
                      src={moment.imageUrl} 
                      alt="Moment" 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105 duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 text-center italic text-xs text-muted-foreground/60">
                      "{moment.content}"
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Content Overlay */}
                  {moment.content && moment.imageUrl && (
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                        {moment.content}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats Footer */}
                <div className="px-6 py-3 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-red-500 fill-current" />
                      <span className="text-[9px] font-black">{moment.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} className="text-primary" />
                      <span className="text-[9px] font-black">Join Discuss</span>
                    </div>
                  </div>
                  <LayoutGrid size={12} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AtSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  );
}
