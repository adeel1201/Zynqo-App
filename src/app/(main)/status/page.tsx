"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { MOCK_STORIES } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

export default function StatusPage() {
  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12]">
      <AppHeader title="Status" showSearch={false} />
      
      <div className="flex flex-col gap-6 p-4">
        {/* User Status */}
        <div className="flex items-center gap-4 bg-card/50 p-4 rounded-[2rem] border border-white/5">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-dashed border-primary p-1">
              <AvatarImage src="https://picsum.photos/seed/me/100/100" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background shadow-lg">
              <Plus size={16} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold">My Status</h3>
            <p className="text-xs text-muted-foreground">Tap to add a new update</p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings size={20} />
          </Button>
        </div>

        {/* Recent Updates */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Recent Updates</h4>
          <div className="flex flex-col divide-y divide-white/5 bg-card/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
            {MOCK_STORIES.map((story) => (
              <div key={story.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                <div className={`p-1 rounded-full border-2 ${story.hasSeen ? 'border-muted' : 'border-primary shadow-[0_0_10px_rgba(159,95,245,0.3)]'}`}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={story.user.avatar} />
                    <AvatarFallback>{story.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h5 className="font-semibold text-sm">{story.user.displayName}</h5>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{story.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expired / Viewed Updates */}
        <div className="flex flex-col gap-4 opacity-50">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Viewed Updates</h4>
          <div className="flex items-center gap-4 p-4 bg-card/10 rounded-[2rem] border border-white/5 grayscale">
            <div className="p-1 rounded-full border-2 border-muted">
              <Avatar className="w-12 h-12">
                <AvatarImage src="https://picsum.photos/seed/old/100/100" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h5 className="font-semibold text-sm">John Doe</h5>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Yesterday, 11:30 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}