
"use client";

import { useParams, useRouter } from 'next/navigation';
import { MOCK_CHATS } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send, Plus, Mic, Sparkles, MoreVertical, Phone, Video } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { aiConversationAssistant } from '@/ai/flows/ai-conversation-assistant-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

export default function ChatDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const chat = MOCK_CHATS.find(c => c.id === id);
  
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(chat ? [
    {
      id: 'm-init-1',
      senderId: chat.participants[0].id,
      text: "Hey! How's it going?",
      timestamp: '10:40 AM',
      status: 'read' as const
    },
    chat.lastMessage
  ] : []);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      timestamp,
      status: 'sent' as const
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setAiSuggestions([]);

    // Simulate a reply after 1.5 seconds
    setTimeout(() => {
      const replyMessage = {
        id: (Date.now() + 1).toString(),
        senderId: chat?.participants[0].id || 'other',
        text: "That sounds great! Let's talk more about it later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered' as const
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1500);
  };

  const handleAiAssist = async () => {
    if (messages.length === 0) return;
    setIsAiLoading(true);
    try {
      const lastReceived = [...messages].reverse().find(m => m.senderId !== 'me');
      
      const result = await aiConversationAssistant({
        messageHistory: messages.slice(-5).map(m => ({ 
          role: m.senderId === 'me' ? 'sender' as const : 'receiver' as const, 
          text: m.text 
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

  if (!chat) return (
    <div className="flex items-center justify-center h-screen bg-[#0E0C12] text-muted-foreground">
      Chat not found
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0E0C12] animate-fade-in relative">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:bg-white/5 rounded-full">
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-primary/20 shadow-lg">
                <AvatarImage src={chat.participants[0].avatar} />
                <AvatarFallback>{chat.participants[0].displayName[0]}</AvatarFallback>
              </Avatar>
              {chat.participants[0].status === 'online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none text-foreground">{chat.participants[0].displayName}</h3>
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest mt-1 block">
                {chat.participants[0].status === 'online' ? 'Active Now' : 'Offline'}
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

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
        <div className="flex justify-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
            Today
          </span>
        </div>
        
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
              <div className={`
                max-w-[85%] px-4 py-3 rounded-[1.5rem] text-sm shadow-sm
                ${isMe 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-card text-foreground rounded-tl-none border border-white/5'
                }
              `}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
              <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                  {msg.timestamp}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Floating UI Container (Input + AI) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-[#0E0C12] via-[#0E0C12]/95 to-transparent pt-10">
        {/* AI Suggestions */}
        {(aiSuggestions.length > 0 || isAiLoading) && (
          <div className="mb-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2 px-2 text-primary">
              <Sparkles size={12} className={isAiLoading ? "animate-spin" : "animate-pulse"} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Zynqo AI Suggestions</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
              {isAiLoading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-9 w-28 rounded-2xl bg-white/5 shrink-0" />)
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

        {/* Chat Input */}
        <div className="flex items-center gap-2 bg-card/60 backdrop-blur-2xl rounded-[2.5rem] p-2 border border-white/10 shadow-2xl">
          <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 rounded-full h-10 w-10 hover:bg-white/5">
            <Plus size={22} />
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
            
            {inputText.trim() ? (
              <Button 
                onClick={handleSend}
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
