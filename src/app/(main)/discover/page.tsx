"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { MOCK_USERS } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Compass, Zap } from 'lucide-react';

export default function DiscoverPage() {
  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12]">
      <AppHeader title="Discover" showSearch={false} />
      
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-[2.5rem] border border-primary/20 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(159,95,245,0.3)] animate-pulse">
            <MapPin size={32} />
          </div>
          <h2 className="text-xl font-headline font-bold">People Nearby</h2>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Discover and connect with awesome people in your immediate vicinity.
          </p>
          <Button className="mt-2 rounded-2xl bg-primary hover:bg-primary/90 px-8">
            Start Radar
          </Button>
        </div>

        <div className="bg-card p-5 rounded-[2rem] border border-white/5 flex flex-col gap-2">
          <Zap className="text-yellow-500 mb-1" size={24} />
          <h3 className="font-bold">Hot Topics</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Trending now</p>
        </div>

        <div className="bg-card p-5 rounded-[2rem] border border-white/5 flex flex-col gap-2">
          <Users className="text-primary mb-1" size={24} />
          <h3 className="font-bold">Channels</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Verified sources</p>
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-lg">Recommended</h3>
          <Button variant="link" className="text-primary p-0 h-auto font-bold text-xs">See All</Button>
        </div>
        
        <div className="flex flex-col gap-4">
          {MOCK_USERS.map((user) => (
            <div key={user.id} className="flex items-center justify-between bg-card/50 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm">{user.displayName}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin size={10} />
                    <span>0.{user.id} km away</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground h-8 px-4 text-xs font-bold">
                Connect
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}