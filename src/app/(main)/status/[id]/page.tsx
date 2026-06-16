"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, X, MoreVertical, Loader2, Play, Pause, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function StatusViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const db = useFirestore();
  
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const statusRef = useMemoFirebase(() => (id && typeof id === 'string') ? doc(db, 'statuses', id) : null, [db, id]);
  const { data: status, loading } = useDoc(statusRef);

  // Check expiration
  useEffect(() => {
    if (status) {
      const date = status.createdAt?.toDate ? status.createdAt.toDate() : new Date();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (diff > 24 * 60 * 60 * 1000) {
        setIsExpired(true);
      }
    }
  }, [status]);

  // Mark as viewed
  useEffect(() => {
    if (status && user && db && !status.viewers?.includes(user.uid) && !isExpired) {
      updateDoc(doc(db, 'statuses', id as string), {
        viewers: arrayUnion(user.uid)
      }).catch(() => {});
    }
  }, [status, user, db, id, isExpired]);

  // Progress timer
  useEffect(() => {
    if (loading || !status || isPaused || isExpired) return;

    const duration = status.mediaType === 'video' ? 15000 : 5000; // 15s for video, 5s for image
    const interval = 50; // update every 50ms
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current!);
          router.push('/status');
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, status, isPaused, router, isExpired]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  if (isExpired) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-primary/40">
        <AlertCircle size={32} />
      </div>
      <div className="space-y-2">
        <h3 className="text-white font-bold">Status Expired</h3>
        <p className="text-xs text-muted-foreground">This update is older than 24 hours and is no longer available.</p>
      </div>
      <Button onClick={() => router.push('/status')} variant="outline" className="rounded-2xl mt-4">Go Back</Button>
    </div>
  );

  if (!status) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-6">
      <p className="text-muted-foreground mb-4">Status not found.</p>
      <Button onClick={() => router.push('/status')} variant="outline" className="rounded-2xl">Go Back</Button>
    </div>
  );

  const date = status.createdAt?.toDate ? status.createdAt.toDate() : new Date();

  return (
    <div className="flex flex-col min-h-screen bg-black animate-fade-in relative overflow-hidden">
      {/* Progress Bar Container */}
      <div className="absolute top-0 left-0 right-0 z-50 p-2 safe-top bg-gradient-to-b from-black/60 to-transparent">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-75 ease-linear" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/20">
              <AvatarImage src={status.userPhoto} />
              <AvatarFallback>{status.userName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm text-white">{status.userName}</h3>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">
                {formatDistanceToNow(date, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" size="icon" 
              onClick={() => setIsPaused(!isPaused)} 
              className="text-white hover:bg-white/10 rounded-full"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </Button>
            <Button 
              variant="ghost" size="icon" 
              onClick={() => router.push('/status')} 
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Media Display */}
      <div 
        className="flex-1 relative flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {status.mediaType === 'video' ? (
          <video 
            src={status.mediaUrl} 
            className="w-full h-full object-contain" 
            autoPlay 
            muted={false}
            playsInline
            onEnded={() => router.push('/status')}
          />
        ) : (
          <div className="relative w-full h-full">
            <Image src={status.mediaUrl} alt="Status Update" fill className="object-contain" priority />
          </div>
        )}

        {status.caption && (
          <div className="absolute bottom-12 left-0 right-0 p-8 text-center bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-lg font-medium shadow-black drop-shadow-lg">
              {status.caption}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Viewers */}
      {status.userId === user?.uid && (
        <div className="absolute bottom-0 left-0 right-0 p-4 safe-bottom flex justify-center bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {status.viewers?.length || 0} Views
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
