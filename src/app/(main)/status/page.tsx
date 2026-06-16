"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Loader2, PlayCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function StatusPage() {
  const { user, profile } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  // Load actual status updates from last 24 hours
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const statusesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'statuses'),
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: statuses = [], loading } = useCollection(statusesQuery);

  // Filter statuses into My Status and Recent Updates
  const myStatuses = statuses.filter((s: any) => s.userId === user?.uid);
  const otherStatuses = statuses.filter((s: any) => s.userId !== user?.uid);

  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12] min-h-screen pb-24">
      <AppHeader title="Status" showSearch={false} />
      
      <div className="flex flex-col gap-6 p-4">
        {/* User Status */}
        <div 
          onClick={() => router.push('/status/create')}
          className="flex items-center gap-4 bg-card/50 p-4 rounded-[2rem] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-dashed border-primary p-1">
              <AvatarImage src={profile?.profilePhoto || "https://picsum.photos/seed/me/100/100"} />
              <AvatarFallback>{profile?.displayName?.[0] || 'ME'}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background shadow-lg">
              <Plus size={16} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold">My Status</h3>
            <p className="text-xs text-muted-foreground">
              {myStatuses.length > 0 ? `${myStatuses.length} updates today` : 'Tap to add a new update'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings size={20} />
          </Button>
        </div>

        {/* Recent Updates */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Recent Updates</h4>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-primary" size={24} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Syncing Stories...</p>
            </div>
          ) : otherStatuses.length > 0 ? (
            <div className="flex flex-col divide-y divide-white/5 bg-card/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
              {otherStatuses.map((story: any) => {
                const hasSeen = story.viewers?.includes(user?.uid);
                const date = story.createdAt?.toDate ? story.createdAt.toDate() : new Date();

                return (
                  <div 
                    key={story.id} 
                    onClick={() => router.push(`/status/${story.id}`)}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className={`p-1 rounded-full border-2 ${hasSeen ? 'border-muted' : 'border-primary shadow-[0_0_10px_rgba(159,95,245,0.3)]'}`}>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={story.userPhoto} />
                        <AvatarFallback>{story.userName?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{story.userName}</h5>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {story.mediaType === 'video' ? <PlayCircle size={10} className="text-primary" /> : <ImageIcon size={10} className="text-primary" />}
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                          {formatDistanceToNow(date, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card/10 rounded-[2.5rem] border border-dashed border-white/5">
              <p className="text-xs text-muted-foreground font-medium">No recent updates from your friends.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}