"use client";

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/use-firebase';
import { useFirestore, useCollection, useMemoFirebase } from '@/hooks/use-firebase';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CallOverlay() {
  const { user } = useFirebaseAuth();
  const db = useFirestore();

  const [activeCall, setActiveCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  // Listen for incoming calls
  const incomingCallsQuery = useMemoFirebase(() => {
    if (!db ||!user?.uid) return null;
    return query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'ringing'),
      limit(1)
    );
  }, [db, user?.uid]);

  const { data: incomingCalls = [] } = useCollection(incomingCallsQuery);

  // Listen for outgoing calls
  const outgoingCallsQuery = useMemoFirebase(() => {
    if (!db ||!user?.uid) return null;
    return query(
      collection(db, 'calls'),
      where('callerId', '==', user.uid),
      where('status', 'in', ['ringing', 'ongoing']),
      limit(1)
    );
  }, [db, user?.uid]);

  const { data: outgoingCalls = [] } = useCollection(outgoingCallsQuery);

  // Handle call state
  useEffect(() => {
    const currentCall = incomingCalls?.[0] || outgoingCalls?.[0];
    if (currentCall) {
      setActiveCall(currentCall);
    } else {
      setActiveCall(null);
      setDuration(0);
    }
  }, [incomingCalls, outgoingCalls]);

  // Duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall?.status === 'ongoing') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  if (!activeCall) return null;

  const isIncoming = activeCall.receiverId === user?.uid && activeCall.status === 'ringing';
  const isOutgoing = activeCall.callerId === user?.uid && activeCall.status === 'ringing';
  const isOngoing = activeCall.status === 'ongoing';

  const partnerName = isIncoming? activeCall.callerName : activeCall.receiverName;
  const partnerPhoto = isIncoming? activeCall.callerPhoto : activeCall.receiverPhoto;

  const handleAccept = () => {
    if (!db) return;
    updateDoc(doc(db, 'calls', activeCall.id), {
      status: 'ongoing',
      startTime: serverTimestamp()
    }).catch(console.error);
  };

  const handleDecline = () => {
    if (!db) return;
    updateDoc(doc(db, 'calls', activeCall.id), {
      status: isIncoming? 'missed' : 'ended',
      endTime: serverTimestamp()
    }).catch(console.error);
  };

  const handleEnd = () => {
    if (!db) return;
    updateDoc(doc(db, 'calls', activeCall.id), {
      status: 'ended',
      endTime: serverTimestamp(),
      duration: duration
    }).catch(console.error);
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-sm aspect-[9/16] bg-white rounded-[3rem] border-border shadow-2xl overflow-hidden flex-col items-center justify-between py-16 px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-white pointer-events-none" />

        <div className="relative z-10 flex-col items-center gap-6 mt-8">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-2xl bg-white">
              <AvatarImage src={partnerPhoto} />
              <AvatarFallback className="text-4xl font-bold bg-muted">{partnerName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            {isOngoing && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text- font-bold text-white shadow-lg">
                {formatDuration(duration)}
              </div>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-headline font-bold text-foreground">{partnerName}</h2>
            <p className="text-xs text-primary font-bold uppercase tracking-[0.3em] mt-2 animate-pulse">
              {isIncoming? 'Incoming Call...' : isOutgoing? 'Calling...' : 'Call in progress'}
            </p>
          </div>
        </div>

        {activeCall.type === 'video' && isOngoing && (
          <div className="relative w-full aspect-video bg-black rounded-2xl border-border flex items-center justify-center overflow-hidden">
             <Video className="text-white/20" size={48} />
             <div className="absolute top-4 right-4 w-24 aspect-[3/4] bg-white/60 border-border rounded-xl flex items-center justify-center backdrop-blur-md">
                <span className="text-[8px] font-bold text-muted-foreground uppercase">YOU</span>
             </div>
          </div>
        )}

        <div className="relative z-10 w-full flex-col gap-8 items-center pb-8">
          {isIncoming && (
            <div className="flex gap-12 items-center">
              <Button
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20"
                size="icon"
              >
                <PhoneOff size={28} />
              </Button>
              <Button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/20"
                size="icon"
              >
                <Phone size={28} />
              </Button>
            </div>
          )}

          {isOutgoing && (
            <Button
              onClick={handleDecline}
              className="w-20 h-20 rounded-full bg-destructive hover:bg-destructive/90 shadow-2xl shadow-destructive/30"
              size="icon"
            >
              <PhoneOff size={32} />
            </Button>
          )}

          {isOngoing && (
            <div className="flex flex-col gap-8 w-full">
              <div className="flex justify-around items-center px-4">
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn("w-14 h-14 rounded-2xl bg-muted border-border", isMuted && "bg-primary text-white border-primary")}
                >
                  {isMuted? <MicOff size={22} /> : <Mic size={22} />}
                </Button>
                {activeCall.type === 'video' && (
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={cn("w-14 h-14 rounded-2xl bg-muted border-border", isVideoOff && "bg-primary text-white border-primary")}
                  >
                    {isVideoOff? <VideoOff size={22} /> : <Video size={22} />}
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="w-14 h-14 rounded-2xl bg-muted border-border"
                >
                  <Maximize2 size={22} />
                </Button>
              </div>
              <Button
                onClick={handleEnd}
                className="w-full h-16 rounded-3xl bg-destructive hover:bg-destructive/90 font-bold text-lg shadow-xl shadow-destructive/20"
              >
                End Call
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}