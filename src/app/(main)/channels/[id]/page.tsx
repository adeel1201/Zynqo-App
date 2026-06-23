"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Send,
  Plus,
  Loader2,
  Radio,
  Users,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useFirebaseAuth, useFirestore, useStorage, useDoc, useCollection, useMemoFirebase } from "@/hooks/use-firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function ChannelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [inputText, setInputText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channelRef = useMemoFirebase(
    () => (db && id && typeof id === 'string')? doc(db, 'channels', id) : null,
    [db, id]
  );

  const { data: channel, loading: channelLoading } = useDoc(channelRef);

  const postsQuery = useMemoFirebase(() => {
    if (!db ||!id) return null;
    return query(collection(db, 'channels', id as string, 'posts'), orderBy('timestamp', 'asc'));
  }, [db, id]);

  const { data: posts = [], loading: postsLoading } = useCollection(postsQuery);

  const isAdmin = useMemo(() => channel?.adminIds?.includes(user?.uid), [channel, user?.uid]);
  const isFollowing = useMemo(() => channel?.followerIds?.includes(user?.uid), [channel, user?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [posts.length]);

  const handleJoinLeave = async () => {
    if (!db ||!user ||!id) return;
    const ref = doc(db, 'channels', id as string);
    try {
      if (isFollowing) {
        await updateDoc(ref, { followerIds: arrayRemove(user.uid) });
        toast({ title: "Unsubscribed" });
      } else {
        await updateDoc(ref, { followerIds: arrayUnion(user.uid) });
        toast({ title: "Welcome to the channel!" });
      }
    } catch (err) {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    }
  };

  const handlePost = async (mediaUrl?: string, mediaType?: string) => {
    if (!db ||!id ||!user || (!inputText.trim() &&!mediaUrl)) return;

    setIsPosting(true);
    const postData = {
      content: inputText.trim(),
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || '',
      authorId: user.uid,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'channels', id as string, 'posts'), postData);
      await updateDoc(doc(db, 'channels', id as string), {
        lastPost: { content: postData.content || `Shared a ${mediaType}`, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp()
      });
      setInputText('');
    } catch (err) {
      toast({ title: "Failed to post", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file ||!user ||!id ||!storage) return;

    setIsUploading(true);
    const storageRef = ref(storage, `channels/${id}/broadcast_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', null,
      (err) => { setIsUploading(false); toast({ title: "Upload failed" }); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const type = file.type.startsWith('video/')? 'video' : 'image';
        await handlePost(url, type);
        setIsUploading(false);
      }
    );
  };

  if (channelLoading || postsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text- font-bold uppercase tracking-widest text-muted-foreground mt-4 opacity-50">Syncing Broadcasts...</p>
    </div>
  );

  if (!channel) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
      <p className="text-muted-foreground mb-4">Channel not found.</p>
      <Button onClick={() => router.push('/channels')} variant="outline" className="rounded-2xl">Back to Directory</Button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background animate-fade-in relative">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/channels')} className="text-muted-foreground">
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-primary/20 rounded-xl">
              <AvatarImage src={channel.photo} />
              <AvatarFallback><Radio size={20} /></AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 text-foreground">
                {channel.name}
                <ShieldCheck size={14} className="text-primary" />
              </h3>
              <span className="text- font-bold uppercase tracking-widest text-muted-foreground mt-1 block">
                {channel.followerIds?.length || 0} Followers
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
            <Bell size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
            <MoreVertical size={20} />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
        <div className="flex flex-col items-center text-center py-10 px-6 bg-muted/30 rounded- border-dashed border-border">
           <Avatar className="w-20 h-20 mb-4 border-2 border-primary/20 rounded-3xl">
              <AvatarImage src={channel.photo} />
              <AvatarFallback><Radio size={32} /></AvatarFallback>
           </Avatar>
           <h4 className="text-lg font-bold text-foreground">{channel.name}</h4>
           <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{channel.description || 'Welcome to our official broadcast channel.'}</p>
           <div className="mt-6 flex items-center gap-4 text- font-bold uppercase tracking-widest text-primary">
              <span className="flex items-center gap-1"><Users size={12} /> {channel.followerIds?.length || 0}</span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span>Broadcast Channel</span>
           </div>
        </div>

        {posts.map((post: any) => {
          const date = post.timestamp?.toDate? post.timestamp.toDate() : new Date();
          const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={post.id} className="flex flex-col items-start animate-fade-in">
              <div className="max-w-[90%] bg-card border-border rounded-2xl rounded-tl-none overflow-hidden shadow-sm">
                {post.mediaUrl && (
                  <div className="relative aspect-video w-full bg-black/5 min-w-[240px]">
                    {post.mediaType === 'video'? (
                      <video src={post.mediaUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <div className="relative w-full aspect-video">
                        <Image src={post.mediaUrl} alt="Channel Media" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                )}
                {post.content && (
                  <div className="p-4">
                    <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>
                  </div>
                )}
                <div className="px-4 pb-2 flex items-center justify-end gap-1.5 opacity-40">
                   <span className="text- font-bold uppercase tracking-tighter text-foreground">{time}</span>
                   <CheckCircle2 size={8} className="text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-white via-white to-transparent pt-10">
        {isAdmin? (
          <div className="flex items-center gap-2 bg-card/60 backdrop-blur-2xl rounded- p-2 border-border shadow-2xl">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
            <Button
              variant="ghost" size="icon" disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary"
            >
              {isUploading? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} />}
            </Button>
            <input
              type="text" placeholder="Broadcast a message..." value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' &&!e.shiftKey && (e.preventDefault(), handlePost())}
              className="flex-1 bg-transparent border-none outline-none text-sm px-2 font-medium text-foreground"
            />
            <Button
              onClick={() => handlePost()}
              disabled={isPosting || (!inputText.trim() &&!isUploading)}
              className="rounded-full bg-primary h-10 w-10 shadow-lg shadow-primary/20"
              size="icon"
            >
              {isPosting? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleJoinLeave}
            className={`w-full h-14 rounded-2xl font-bold text-lg shadow-xl transition-all ${isFollowing? 'bg-muted border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'}`}
          >
            {isFollowing? 'Leave Channel' : 'Join Channel'}
          </Button>
        )}
      </div>
    </div>
  );
}