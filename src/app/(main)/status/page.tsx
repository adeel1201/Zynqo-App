"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Loader2, PlayCircle, Image as ImageIcon, Clock } from 'lucide-react';
import { useFirebaseAuth, useFirestore, useCollection, useMemoFirebase } from '@/hooks/use-firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

export default function StatusPage() {
  const { user } = useFirebaseAuth();
  const db = useFirestore();
  const router = useRouter();
  const [last24h, setLast24h] = useState<Date | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    setLast24h(d);
  }, []);

  // Load status updates from the last 24 hours
  const statusesQuery = useMemoFirebase(() => {
    if (!db ||!user?.uid ||!last24h) return null;
    return query(
      collection(db, 'statuses'),
      where('createdAt', '>=', Timestamp.fromDate(last24h)),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db, user?.uid, last24h]);

  const { data: statuses = [], loading } = useCollection(statusesQuery);

  // Filter statuses into My Status and Recent Updates
  const myStatuses = statuses.filter((s: any) => s.userId === user?.uid);
  const otherStatuses = statuses.filter((s: any) => s.userId!== user?.uid);

  const getExpiryText = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.toDate? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hoursPassed = diff / (1000 * 60 * 60);
    const hoursLeft = Math.max(0, Math.floor(24 - hoursPassed));
    return `Expires in ${hoursLeft}h`;
  };

  return (
    <div className="flex flex-col animate-fade-in bg-background min-h-screen pb-24">
      <AppHeader title="Status" showSearch={false} />

      <div className="flex flex-col gap-6 p-4">
        {/* User Status */}
        <div
          onClick={() => router.push('/status/create')}
          className="flex items-center gap-4 bg-white p-4 rounded-xl border-border cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
        >
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-dashed border-primary p-1">
              <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/me/100/100"} />
              <AvatarFallback>{user?.displayName?.[0] || 'ME'}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-white shadow-lg">
              <Plus size={16} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-foreground">My Status</h3>
            <p className="text-xs text-muted-foreground">
              {myStatuses.length > 0? `${myStatuses.length} active updates` : 'Tap to add a new update'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings size={20} />
          </Button>
        </div>

        {/* Recent Updates */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Recent Updates</h4>

          {loading? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-primary" size={24} />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">Syncing Stories...</p>
            </div>
          ) : otherStatuses.length > 0? (
            <div className="flex flex-col divide-y divide-border bg-white rounded-xl border-border overflow-hidden shadow-sm">
              {otherStatuses.map((story: any) => {
                const hasSeen = story.viewers?.includes(user?.uid);
                const date = story.createdAt?.toDate? story.createdAt.toDate() : new Date();

                return (
                  <div
                    key={story.id}
                    onClick={() => router.push(`/status/${story.id}`)}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className={`p-1 rounded-full border-2 ${hasSeen? 'border-muted' : 'border-primary shadow-[0_0_10px_rgba(159,95,245,0.1)]'}`}>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={story.userPhoto} />
                        <AvatarFallback>{story.userName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm text-foreground">{story.userName}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                           {story.mediaType === 'video'? <PlayCircle size={10} className="text-primary" /> : <ImageIcon size={10} className="text-primary" />}
                           <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                             {formatDistanceToNow(date, { addSuffix: true })}
                           </span>
                        </div>
                        <span className="text-muted-foreground/20">•</span>
                        <div className="flex items-center gap-1 text-primary/70">
                           <Clock size={10} />
                           <span className="text-xs font-bold uppercase tracking-tighter">
                             {getExpiryText(story.createdAt)}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-muted/20 rounded-xl border-dashed border-border">
              <p className="text-xs text-muted-foreground font-medium">No recent updates from your friends.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}