"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { MOCK_MOMENTS } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function MomentsPage() {
  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12]">
      <AppHeader title="Moments" showActions={false} />
      
      <div className="flex flex-col gap-4 p-4">
        {MOCK_MOMENTS.map((moment) => (
          <div 
            key={moment.id} 
            className="bg-card rounded-3xl overflow-hidden border border-white/5 shadow-xl transition-transform active:scale-[0.98]"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-primary/20">
                  <AvatarImage src={moment.user.avatar} />
                  <AvatarFallback>{moment.user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm leading-none flex items-center gap-1">
                    {moment.user.displayName}
                    {moment.user.verified && <span className="text-primary text-[10px]">●</span>}
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    {moment.timestamp}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <MoreHorizontal size={18} />
              </Button>
            </div>

            <div className="px-4 pb-3">
              <p className="text-sm leading-relaxed text-foreground/90 font-light">
                {moment.content}
              </p>
            </div>

            {moment.media && moment.media.length > 0 && (
              <div className="relative aspect-[4/3] w-full bg-muted">
                <Image 
                  src={moment.media[0]} 
                  alt="Moment Media" 
                  fill 
                  className="object-cover"
                  data-ai-hint="lifestyle moment"
                />
              </div>
            )}

            <div className="p-4 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 group">
                  <Heart size={20} className="text-muted-foreground group-hover:text-red-500 transition-colors" />
                  <span className="text-xs font-semibold text-muted-foreground">{moment.likes}</span>
                </button>
                <button className="flex items-center gap-2 group">
                  <MessageCircle size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-muted-foreground">{moment.comments}</span>
                </button>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <Share2 size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}