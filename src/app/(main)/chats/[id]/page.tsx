"use client";

import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Send, 
  Plus, 
  Mic, 
  Sparkles, 
  MoreVertical, 
  Phone, 
  Video, 
  Loader2, 
  FileIcon, 
  Download,
  Image as ImageIcon,
  PlayCircle,
  X
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { aiConversationAssistant } from '@/ai/flows/ai-conversation-assistant-flow';
import { useAuth } from '@/context/AuthContext';
import { 
  useFirestore, 
  useStorage,
  useDoc, 
  useCollection,
  useMemoFirebase
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function ChatDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat metadata
  const chatRef = useMemoFirebase(() => id ? doc(db, 'chats', id as string) : null, [db, id]);
  const { data: chat, loading: chatLoading } = useDoc(chatRef);

  // Load messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(
      collection(db, 'chats', id as string, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [db, id]);

  const { data: messages = [], loading: messagesLoading } = useCollection(messagesQuery);

  // Presence lookup for partner
  const partnerId = useMemo(() => chat?.participantIds?.find((uid: string) => uid !== user?.uid), [chat, user?.uid]);
  const partnerRef = useMemoFirebase(() => partnerId ? doc(db, 'users', partnerId) : null, [db, partnerId]);
  const { data: partnerProfile } = useDoc(partnerRef);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0 && user && id && db) {
      const unreadIncoming = messages.filter(
        (m) => m.senderId !== user.uid && m.status !== 'read'
      );

      unreadIncoming.forEach((msg) => {
        const msgRef = doc(db, 'chats', id as string, 'messages', msg.id);
        updateDoc(msgRef, { status: 'read' }).catch(() => {});
      });
    }
  }, [messages, user, id, db]);

  const handleSend = (mediaData?: { url: string; type: string; name?: string }) => {
    if ((!inputText.trim() && !mediaData) || !user || !id || !db) return;
    
    const textToSend = inputText.trim();
    const messageData: any = {
      senderId: user.uid,
      timestamp: serverTimestamp(),
      status: 'sent'
    };

    if (textToSend) messageData.text = textToSend;
    if (mediaData) {
      messageData.mediaUrl = mediaData.url;
      messageData.mediaType = mediaData.type;
      if (mediaData.name) messageData.fileName = mediaData.name;
    }

    const messagesRef = collection(db, 'chats', id as string, 'messages');
    const currentChatRef = doc(db, 'chats', id as string);
    
    addDoc(messagesRef, messageData).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: messagesRef.path,
        operation: 'create',
        requestResourceData: messageData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    updateDoc(currentChatRef, {
      lastMessage: {
        text: mediaData ? `Shared a ${mediaData.type}` : textToSend,
        senderId: user.uid,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    }).catch(() => {});
    
    setInputText('');
    setAiSuggestions([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id || !storage) return;

    setIsUploading(true);
    const storageRef = ref(storage, `chats/${id}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your file.",
          variant: "destructive"
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        let type = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        handleSend({
          url: downloadURL,
          type,
          name: file.name
        });
        setIsUploading(false);
      }
    );
  };

  const handleAiAssist = async () => {
    if (messages.length === 0 || !user) return;
    setIsAiLoading(true);
    try {
      const lastReceived = [...messages].reverse().find(m => m.senderId !== user.uid);
      
      const result = await aiConversationAssistant({
        messageHistory: messages.slice(-5).map(m => ({ 
          role: m.senderId === user.uid ? 'sender' as const : 'receiver' as const, 
          text: m.text || (m.mediaUrl ? `[Shared ${m.mediaType}]` : "")
        })),
        lastReceivedMessage: lastReceived?.text || "Hello",
        targetLanguage: "English"
      });
      setAiSuggestions(result.suggestedReplies);
    } catch (err) {
      console.error("AI Assistant Error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return 'Offline';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `Last seen ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (chatLoading || messagesLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0E0C12] text-primary">
      <Loader2 className="animate-spin mb-4" size={32} />
      <p className="text-xs font-bold uppercase tracking-widest opacity-50">Syncing Messages...</p>
    </div>
  );

  if (!chat) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0E0C12] text-muted-foreground p-6 text-center">
      <p className="mb-4">Conversation not found or access denied.</p>
      <Button onClick={() => router.push('/chats')} variant="outline" className="rounded-2xl border-primary/20 text-primary">
        Back to Chats
      </Button>
    </div>
  );

  const partnerName = partnerProfile?.displayName || chat.participantNames?.find((n: string) => n !== user?.displayName) || 'Chat Partner';
  const isOnline = partnerProfile?.onlineStatus === 'online';

  return (
    <div className="flex flex-col h-screen bg-[#0E0C12] animate-fade-in relative">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:bg-white/5 rounded-full">
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-primary/20 shadow-lg">
                <AvatarImage src={partnerProfile?.profilePhoto || `https://picsum.photos/seed/${id}/100/100`} />
                <AvatarFallback>{partnerName[0]}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none text-foreground">{partnerName}</h3>
              <span className={`text-[9px] uppercase font-bold tracking-widest mt-1 block ${isOnline ? 'text-primary' : 'text-muted-foreground'}`}>
                {isOnline ? 'Active Now' : formatLastSeen(partnerProfile?.lastSeen)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 pr-2">
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full h-10 w-10">
            <Phone size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full h-10 w-10">
            <Video size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-white/5 rounded-full h-10 w-10">
            <MoreVertical size={20} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
        {messages.length === 0 && !messagesLoading && (
          <div className="flex justify-center mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
              No messages yet
            </span>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          const date = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
              <div className={`
                max-w-[85%] rounded-[1.5rem] shadow-sm overflow-hidden
                ${isMe 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-card text-foreground rounded-tl-none border border-white/5'
                }
              `}>
                {msg.mediaUrl && (
                  <div className="relative group">
                    {msg.mediaType === 'image' ? (
                      <div className="relative aspect-square w-full min-w-[200px] max-w-[300px]">
                        <Image 
                          src={msg.mediaUrl} 
                          alt="Shared Image" 
                          fill 
                          className="object-cover"
                          data-ai-hint="shared image"
                        />
                      </div>
                    ) : msg.mediaType === 'video' ? (
                      <div className="relative max-w-[300px]">
                        <video 
                          src={msg.mediaUrl} 
                          controls 
                          className="w-full rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="p-4 flex items-center gap-3 bg-white/5">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                          <FileIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{msg.fileName || 'Shared Document'}</p>
                          <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Document</p>
                        </div>
                        <a 
                          href={msg.mediaUrl} 
                          download 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {msg.text && (
                  <div className="px-4 py-3">
                    <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.text}</p>
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                  {timeString}
                </span>
                {isMe && (
                  <span className={`text-[9px] font-bold ${msg.status === 'read' ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    {msg.status === 'read' ? 'READ' : 'SENT'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-[#0E0C12] via-[#0E0C12]/95 to-transparent pt-10">
        {(aiSuggestions.length > 0 || isAiLoading) && (
          <div className="mb-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2 px-2 text-primary">
              <Sparkles size={12} className={isAiLoading ? "animate-spin" : "animate-pulse"} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Zynqo AI Suggestions</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
              {isAiLoading ? (
                [1,2,3].map(i => <div key={i} className="h-9 w-28 rounded-2xl bg-white/5 shrink-0 animate-pulse" />)
              ) : (
                aiSuggestions.map((suggestion, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-2xl bg-primary/5 border-primary/20 text-xs font-semibold whitespace-nowrap hover:bg-primary/10 text-primary transition-all active:scale-95"
                    onClick={() => setInputText(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-card/60 backdrop-blur-2xl rounded-[2.5rem] p-2 border border-white/10 shadow-2xl">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground shrink-0 rounded-full h-10 w-10 hover:bg-white/5"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} />}
          </Button>
          
          <input 
            type="text" 
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 px-2 font-medium"
          />
          
          <div className="flex items-center gap-1">
            {!inputText.trim() && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleAiAssist}
                className="text-primary hover:bg-primary/10 shrink-0 rounded-full h-10 w-10 transition-colors"
                title="Get AI Suggestions"
              >
                <Sparkles size={20} />
              </Button>
            )}
            
            {(inputText.trim()) ? (
              <Button 
                onClick={() => handleSend()}
                size="icon" 
                className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 shadow-lg shadow-primary/20 active:scale-90 transition-transform"
              >
                <Send size={18} />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 rounded-full h-10 w-10 hover:bg-white/5">
                <Mic size={22} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
