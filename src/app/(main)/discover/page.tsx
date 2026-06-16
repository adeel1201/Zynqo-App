"use client";

import { useState, useMemo } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DiscoverPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch Global Users for Suggestions
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), limit(15));
  }, [db]);
  const { data: allUsers = [], loading: usersLoading } = useCollection(usersQuery);

  // Trending Logic: Sort by followers/likes in memory (since Firestore doesn't support array length sorting directly)
  const trendingChannels = useMemo(() => {
    return [...channels].sort((a: any, b: any) => (b.followerIds?.length || 0) - (a.followerIds?.length || 0)).slice(0, 3);
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
        {/* Search & Radar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-all" />
          <div className="relative bg-card/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(159,95,245,0.2)]">
              <Compass size={32} className="animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-headline font-bold">Explore Zynqo</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Find what's buzzing in your universe</p>
            </div>
            
            <div className="w-full relative mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search people, channels, or moments..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl focus-visible:ring-primary text-sm"
              />
            </div>
          </div>
        </div>

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
              [1, 2, 3].map(i => <div key={i} className="min-w-[200px] h-32 rounded-3xl bg-white/5 animate-pulse" />)
            ) : trendingChannels.length > 0 ? (
              trendingChannels.map((channel: any) => (
                <div 
                  key={channel.id}
                  onClick={() => router.push(`/channels/${channel.id}`)}
                  className="min-w-[240px] bg-card/60 border border-white/5 p-4 rounded-3xl flex flex-col gap-3 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-2xl border border-primary/20">
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
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{channel.description || 'Join our broadcast channel'}</p>
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
              <div key={u.uid} className="flex items-center justify-between bg-card/30 p-3 rounded-2xl border border-white/5">
                <div 
                  className="flex items-center gap-3 cursor-pointer" 
                  onClick={() => router.push(`/users/${u.uid}`)}
                >
                  <Avatar className="h-12 w-12 rounded-xl border border-white/10">
                    <AvatarImage src={u.profilePhoto} />
                    <AvatarFallback>{u.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm">{u.displayName}</h4>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      <MapPin size={8} />
                      <span>{u.country || 'Global'}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => router.push(`/users/${u.uid}`)}
                  className="rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-white h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Moments */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-secondary" />
              <h3 className="font-headline font-bold text-lg">Popular Moments</h3>
            </div>
            <Button variant="link" onClick={() => router.push('/moments')} className="text-primary text-[10px] font-bold uppercase tracking-widest p-0 h-auto">Feed</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-3xl bg-white/5 animate-pulse" />)
            ) : trendingMoments.map((moment: any) => (
              <div 
                key={moment.id}
                onClick={() => router.push('/moments')}
                className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/5 group bg-card/20 cursor-pointer"
              >
                {moment.imageUrl ? (
                  <Image 
                    src={moment.imageUrl} 
                    alt="Moment" 
                    fill 
                    className="object-cover transition-transform group-hover:scale-110 duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-center">
                    <p className="text-[10px] font-medium leading-relaxed italic line-clamp-4">"{moment.content}"</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Heart size={12} className="text-red-500 fill-current" />
                  <span className="text-[10px] font-bold text-white">{moment.likes?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
