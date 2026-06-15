"use client";

import { useParams, useRouter } from 'next/navigation';
import { MOCK_CHATS, MOCK_CURRENT_USER } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send, Plus, Mic, Sparkles, Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { aiConversationAssistant } from '@/ai/flows/ai-conversation-assistant-flow';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const chat = MOCK_CHATS.find(c => c.id === id);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(chat ? [chat.lastMessage] : []);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setAiSuggestions([]);
  };

  const handleAiAssist = async () => {
    if (messages.length === 0) return;
    setIsAiLoading(true);
    try {
      const lastMsg = messages[messages.length - 1];
      const result = await aiConversationAssistant({
        messageHistory: messages.map(m => ({ 
          role: m.senderId === 'me' ? 'sender' as const : 'receiver' as const, 
          text: m.text 
        })),
        lastReceivedMessage: lastMsg.senderId !== 'me' ? lastMsg.text : "No recent incoming message",
        targetLanguage: "English"
      });
      setAiSuggestions(result.suggestedReplies);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!chat) return <div>Chat not found</div>;

  return (
    <div className="flex flex-col h-screen bg-[#0E0C12] animate-fade-in">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 glass-morphism safe-top px-2 h-16 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground">
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={chat.participants[0].avatar} />
              <AvatarFallback>{chat.participants[0].displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm leading-none">{chat.participants[0].displayName}</h3>
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{chat.participants[0].status}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[80%] px-4 py-2.5 rounded-[1.25rem] text-sm
                ${isMe 
                  ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10' 
                  : 'bg-card text-foreground rounded-tl-none border border-white/5 shadow-md'
                }
              `}>
                <p className="leading-relaxed">{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  <span className="text-[10px] font-medium">{msg.timestamp}</span>
                  {isMe && <span className="text-[10px]">✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Assistance Drawer */}
      {(aiSuggestions.length > 0 || isAiLoading) && (
        <div className="px-4 py-3 bg-card/40 border-t border-white/5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3 text-primary">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Smart Replies</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {isAiLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full bg-white/5" />)
            ) : (
              aiSuggestions.map((suggestion, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-primary/10 border-primary/20 text-xs font-medium whitespace-nowrap"
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
      <div className="p-4 safe-bottom">
        <div className="flex items-center gap-2 bg-card rounded-[2rem] p-1.5 border border-white/5 shadow-2xl">
          <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 rounded-full h-10 w-10">
            <Plus size={20} />
          </Button>
          <input 
            type="text" 
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground px-2"
          />
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAiAssist}
              className="text-primary hover:text-primary shrink-0 rounded-full h-10 w-10 hover:bg-primary/10 transition-colors"
            >
              <Sparkles size={20} />
            </Button>
            {inputText.trim() ? (
              <Button 
                onClick={handleSend}
                size="icon" 
                className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 shadow-lg shadow-primary/20"
              >
                <Send size={18} />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 rounded-full h-10 w-10">
                <Mic size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}