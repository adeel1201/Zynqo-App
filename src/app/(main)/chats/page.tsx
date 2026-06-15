"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { MOCK_CHATS, MOCK_STORIES } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatsPage() {
  return (
    <div className="flex flex-col animate-fade-in">
      <AppHeader title="Zynqo" />
      
      {/* Active Stories Row */}
      <div className="p-4 border-b border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-dashed border-muted-foreground p-1">
                <AvatarImage src="https://picsum.photos/seed/me/100/100" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                <Plus size={14} />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">You</span>
          </div>
          
          {MOCK_STORIES.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`p-1 rounded-full border-2 ${story.hasSeen ? 'border-muted' : 'border-primary'}`}>
                <Avatar className="w-14 h-14">
                  <AvatarImage src={story.user.avatar} />
                  <AvatarFallback>{story.user.displayName[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate w-16 text-center">
                {story.user.displayName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex flex-col divide-y divide-white/5">
        {MOCK_CHATS.map((chat) => (
          <Link 
            key={chat.id} 
            href={`/chats/${chat.id}`}
            className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors active:bg-white/10"
          >
            <div className="relative">
              <Avatar className="w-14 h-14">
                <AvatarImage src={chat.participants[0].avatar} />
                <AvatarFallback>{chat.participants[0].displayName[0]}</AvatarFallback>
              </Avatar>
              {chat.participants[0].status === 'online' && (
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-semibold text-foreground truncate">
                  {chat.participants[0].displayName}
                  {chat.participants[0].verified && <span className="ml-1 text-primary inline-block">✓</span>}
                </h3>
                <span className="text-xs text-muted-foreground font-medium">
                  {chat.lastMessage.timestamp}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground truncate leading-relaxed">
                  {chat.lastMessage.senderId === 'me' && "You: "}
                  {chat.lastMessage.text}
                </p>
                {chat.unreadCount > 0 && (
                  <Badge variant="default" className="bg-primary hover:bg-primary text-[10px] h-5 min-w-[20px] flex items-center justify-center">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Floating Action Button */}
      <Button 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 z-30"
        size="icon"
      >
        <MessageSquare size={24} />
      </Button>
    </div>
  );
}
