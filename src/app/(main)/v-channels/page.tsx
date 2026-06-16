
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Loader2, 
  Music2, 
  MoreVertical,
  ArrowLeft,
  Search,
  Zap,
  PlayCircle,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { VCommentsDialog } from '@/components/zynqo/VCommentsDialog';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const PAGE_SIZE = 5;

export default function VChannelsPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [feedType, setFeedType] = useState<'following' | 'for-you'>('for-you');
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);
  const observer = useRef<IntersectionObserver | null>(null);

  // Logic to find which channels the user follows
  const followingChannelsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'creatorChannels'),
      where('followerIds', 'array-contains', user.uid)
    );
  }, [db, user?.uid]);

  const { data: followedChannels = [] } = useCollection(followingChannelsQuery);
  const followedCreatorIds = useMemo(() => followedChannels.map(c => c.creatorId), [followedChannels]);

  // Combined Query Logic
  const postsQuery = useMemoFirebase(() => {
    if (!db) return null;

    if (feedType === 'following') {
      if (followedCreatorIds.length === 0) return null;
      // Firestore 'in' query is limited to 10 IDs. This is standard for MVP.
      return query(
        collection(db, 'creatorPosts'),
        where('creatorId', 'in', followedCreatorIds.slice(0, 10)),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    // For You Feed (Global Trending/Newest)
    return query(
      collection(db, 'creatorPosts'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
  }, [db, feedType, followedCreatorIds, limitCount]);

  const { data: posts = [], loading } = useCollection(postsQuery);

  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setLimitCount(prev => prev + PAGE_SIZE);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading]);

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden relative">
      {/* Header Overlay with Tabs */}
      <div className="absolute top-0 left-0 right-0 z-50 safe-top px-4 h-20 flex flex-col justify-center bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
             <button 
               onClick={() => { setFeedType('following'); setLimitCount(PAGE_SIZE); }}
               className={cn(
                 "text-base font-bold transition-all relative py-2",
                 feedType === 'following' ? "text-white scale-110" : "text-white/50"
               )}
             >
               Following
               {feedType === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full" />}
             </button>
             <button 
               onClick={() => { setFeedType('for-you'); setLimitCount(PAGE_SIZE); }}
               className={cn(
                 "text-base font-bold transition-all relative py-2",
                 feedType === 'for-you' ? "text-white scale-110" : "text-white/50"
               )}
             >
               For You
               {feedType === 'for-you' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full" />}
             </button>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={() => router.push('/v-channels/search')} className="text-white hover:bg-white/10 rounded-full">
               <Search size={22} />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => router.push('/v-channels/create')} className="text-white hover:bg-white/10 rounded-full">
               <Plus size={24} />
             </Button>
          </div>
        </div>
      </div>

      {/* Vertical Feed */}
      <div className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {posts.length > 0 ? (
          posts.map((post: any, i: number) => (
            <VideoPostCard 
              key={post.id} 
              post={post} 
              ref={posts.length === i + 1 ? lastPostRef : null} 
            />
          ))
        ) : !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-white p-12 text-center gap-6">
             <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                <PlayCircle size={48} className="text-muted-foreground opacity-20" />
             </div>
             <div className="space-y-2">
               <h3 className="text-lg font-bold">
                 {feedType === 'following' ? "No Following Content" : "No Broadcasts Yet"}
               </h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 {feedType === 'following' 
                   ? "You haven't followed any creators yet. Explore 'For You' to find interesting channels!" 
                   : "Channels content is currently empty. Be the first to share your broadcast!"}
               </p>
             </div>
             <Button 
               onClick={() => feedType === 'following' ? setFeedType('for-you') : router.push('/v-channels/create')} 
               className="rounded-full bg-primary px-8 h-12 font-bold"
             >
               {feedType === 'following' ? "Explore For You" : "Start Creating"}
             </Button>
          </div>
        ) : null}
        {loading && (
          <div className="h-screen flex items-center justify-center bg-black">
             <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
      </div>
    </div>
  );
}

const VideoPostCard = ({ post, ref }: { post: any, ref?: any }) => {
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes?.includes(user?.uid));
  }, [post.likes, user?.uid]);

  const toggleLike = async () => {
    if (!db || !user) return;
    const postRef = doc(db, 'creatorPosts', post.id);
    updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDelete = async () => {
    if (!db || !user || user.uid !== post.creatorId) return;
    const postRef = doc(db, 'creatorPosts', post.id);
    deleteDoc(postRef)
      .then(() => {
        toast({ title: "Post removed" });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: postRef.path,
          operation: 'delete'
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const isMe = user?.uid === post.creatorId;

  return (
    <div ref={ref} className="h-screen w-full snap-start relative flex flex-col justify-center bg-black overflow-hidden">
      {post.type === 'video' ? (
        <video 
          ref={videoRef}
          src={post.mediaUrl}
          className="w-full h-full object-contain cursor-pointer"
          loop
          playsInline
          onClick={handleVideoClick}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      ) : post.type === 'image' ? (
        <div className="relative w-full h-full">
           <Image src={post.mediaUrl} alt="Post" fill className="object-contain" />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center p-12 bg-gradient-to-br from-primary/20 via-black to-secondary/10">
          <p className="text-xl font-medium text-center leading-relaxed text-white/90 italic">
            "{post.caption}"
          </p>
        </div>
      )}

      {/* Interaction Bar */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
           <div 
             onClick={() => router.push(`/v-channels/${post.creatorId}`)}
             className="relative mb-4 cursor-pointer"
           >
             <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                <AvatarImage src={post.creatorAvatar} />
                <AvatarFallback>{post.creatorName?.[0]}</AvatarFallback>
             </Avatar>
             {!isMe && (
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border-2 border-black">
                  <Plus size={10} className="text-white" />
               </div>
             )}
           </div>
        </div>

        <button onClick={toggleLike} className="flex flex-col items-center gap-1 group">
           <div className={cn("p-2 rounded-full transition-transform active:scale-125", isLiked ? "text-red-500" : "text-white drop-shadow-md")}>
              <Heart size={32} className={isLiked ? "fill-current" : ""} />
           </div>
           <span className="text-[10px] font-bold text-white drop-shadow-md">{post.likes?.length || 0}</span>
        </button>

        <button onClick={() => setIsCommentsOpen(true)} className="flex flex-col items-center gap-1 group">
           <div className="p-2 text-white transition-transform active:scale-125 drop-shadow-md">
              <MessageCircle size={32} />
           </div>
           <span className="text-[10px] font-bold text-white drop-shadow-md">{post.commentsCount || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
           <div className="p-2 text-white transition-transform active:scale-125 drop-shadow-md">
              <Share2 size={32} />
           </div>
           <span className="text-[10px] font-bold text-white drop-shadow-md">{post.sharesCount || 0}</span>
        </button>

        {isMe && (
          <button onClick={handleDelete} className="flex flex-col items-center gap-1 mt-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="p-2 text-white">
               <Trash2 size={24} />
            </div>
          </button>
        )}
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-16 left-0 right-16 p-4 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <h4 className="font-bold text-white text-base mb-1 cursor-pointer flex items-center gap-2" onClick={() => router.push(`/v-channels/${post.creatorId}`)}>
          @{post.creatorName}
          {post.isVerified && <Zap size={12} className="text-yellow-500 fill-current" />}
        </h4>
        <p className="text-sm text-white/90 line-clamp-2 leading-relaxed mb-3">
          {post.caption}
        </p>
        <div className="flex items-center gap-2 text-white/60">
           <Music2 size={12} className="animate-spin-slow" />
           <span className="text-[10px] font-medium tracking-wide truncate">Original Sound - {post.creatorName}</span>
        </div>
      </div>

      {isCommentsOpen && (
        <VCommentsDialog 
          postId={post.id} 
          isOpen={isCommentsOpen} 
          onOpenChange={setIsCommentsOpen} 
        />
      )}
    </div>
  );
};
