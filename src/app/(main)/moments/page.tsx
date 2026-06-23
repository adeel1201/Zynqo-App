"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Loader2, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useFirebaseAuth, useFirestore, useCollection, useMemoFirebase } from '@/hooks/use-firebase';
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';
import { CommentsDialog } from '@/components/zynqo/CommentsDialog';

const INITIAL_PAGE_SIZE = 5;
const INCREMENT_PAGE_SIZE = 5;

export default function MomentsPage() {
  const db = useFirestore();
  const { user } = useFirebaseAuth();
  const router = useRouter();

  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [limitCount, setLimitCount] = useState(INITIAL_PAGE_SIZE);

  const observer = useRef<IntersectionObserver | null>(null);

  const momentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'moments'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }, [db, limitCount]);

  const { data: moments = [], loading } = useCollection(momentsQuery);

  const hasMore = moments.length === limitCount;

  const lastMomentElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLimitCount(prevCount => prevCount + INCREMENT_PAGE_SIZE);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleToggleLike = (momentId: string, currentLikes: string[] = []) => {
    if (!db ||!user) return;

    const momentRef = doc(db, 'moments', momentId);
    const isLiked = currentLikes.includes(user.uid);

    updateDoc(momentRef, {
      likes: isLiked? arrayRemove(user.uid) : arrayUnion(user.uid)
    }).catch((err) => {
      console.error('Like error:', err);
    });
  };

  const handleOpenComments = (momentId: string) => {
    setSelectedMomentId(momentId);
    setIsCommentsOpen(true);
  };

  return (
    <div className="flex flex-col animate-fade-in bg-background min-h-screen">
      <AppHeader title="Moments" showActions={false} />

      <div className="flex flex-col gap-4 p-4 pb-32">
        {moments.length > 0? (
          moments.map((moment: any, index: number) => {
            const date = moment.createdAt?.toDate? moment.createdAt.toDate() : new Date();
            const timeAgo = formatDistanceToNow(date, { addSuffix: true });
            const isLiked = moment.likes?.includes(user?.uid);
            const likeCount = moment.likes?.length || 0;
            const isLastElement = moments.length === index + 1;

            return (
              <div
                key={moment.id}
                ref={isLastElement? lastMomentElementRef : null}
                className="bg-card rounded- overflow-hidden border-border shadow-sm transition-all duration-300"
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-primary/20">
                      <AvatarImage src={moment.userPhoto} />
                      <AvatarFallback className="bg-primary/5 text-primary">{moment.userName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm leading-none flex items-center gap-1 text-foreground">
                        {moment.userName}
                      </h4>
                      <span className="text- text-muted-foreground font-bold uppercase tracking-widest mt-1 block">
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                </div>

                {moment.content && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {moment.content}
                    </p>
                  </div>
                )}

                {moment.videoUrl? (
                  <div className="relative aspect-video w-full bg-black/5">
                    <video
                      src={moment.videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      preload="metadata"
                    />
                  </div>
                ) : moment.imageUrl? (
                  <div className="relative aspect-[4/3] w-full bg-muted/20">
                    <Image
                      src={moment.imageUrl}
                      alt="Moment Media"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}

                <div className="px-5 py-4 border-t border-border flex items-center gap-6">
                  <button
                    onClick={() => handleToggleLike(moment.id, moment.likes)}
                    className="flex items-center gap-2 group transition-colors"
                  >
                    <div className={cn(
                      "p-2 rounded-full transition-all duration-300",
                      isLiked? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground group-hover:bg-red-500/5 group-hover:text-red-400"
                    )}>
                      <Heart size={20} className={cn(isLiked && "fill-current")} />
                    </div>
                    <span className={cn(
                      "text-xs font-bold transition-colors",
                      isLiked? "text-red-500" : "text-muted-foreground"
                    )}>
                      {likeCount}
                    </span>
                  </button>

                  <button
                    onClick={() => handleOpenComments(moment.id)}
                    className="flex items-center gap-2 group transition-colors"
                  >
                    <div className="p-2 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-all">
                      <MessageSquare size={20} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      View Comments
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        ) :!loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-muted-foreground opacity-40" />
            </div>
            <h4 className="font-bold text-lg mb-1 text-foreground">No moments yet</h4>
            <p className="text-xs text-muted-foreground">Be the first to share something with the world!</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text- font-bold uppercase tracking-widest text-muted-foreground opacity-50">Loading Moments...</p>
          </div>
        )}

        {!hasMore && moments.length > 0 &&!loading && (
          <div className="py-8 text-center">
            <p className="text- font-bold uppercase tracking-widest text-muted-foreground opacity-30">You've reached the end</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => router.push('/moments/create')}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 z-30 transition-transform active:scale-90 text-white"
        size="icon"
      >
        <Plus size={24} />
      </Button>

      {selectedMomentId && (
        <CommentsDialog
          momentId={selectedMomentId}
          isOpen={isCommentsOpen}
          onOpenChange={setIsCommentsOpen}
        />
      )}
    </div>
  );
}