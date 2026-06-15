"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { MOCK_USERS } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, MoreHorizontal } from 'lucide-react';

export default function CallsPage() {
  const CALL_LOGS = [
    { user: MOCK_USERS[0], type: 'incoming', status: 'missed', time: '10:30 AM' },
    { user: MOCK_USERS[1], type: 'outgoing', status: 'completed', time: 'Yesterday' },
    { user: MOCK_USERS[2], type: 'incoming', status: 'completed', time: 'Monday' },
  ];

  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12]">
      <AppHeader title="Calls" />
      
      <div className="p-4 flex flex-col gap-4">
        {/* Create Link */}
        <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-[2rem] border border-primary/20">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Video size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Create Call Link</h3>
            <p className="text-xs text-muted-foreground">Share a link for your Zynqo call</p>
          </div>
        </div>

        {/* Call History */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Recent Calls</h4>
          <div className="flex flex-col divide-y divide-white/5 bg-card/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
            {CALL_LOGS.map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={log.user.avatar} />
                  <AvatarFallback>{log.user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h5 className="font-semibold text-sm">{log.user.displayName}</h5>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {log.status === 'missed' ? (
                      <PhoneMissed size={12} className="text-red-500" />
                    ) : log.type === 'incoming' ? (
                      <PhoneIncoming size={12} className="text-green-500" />
                    ) : (
                      <PhoneOutgoing size={12} className="text-primary" />
                    )}
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{log.time}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-primary h-9 w-9">
                    <Phone size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-primary h-9 w-9">
                    <Video size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      <Button 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 z-30"
        size="icon"
      >
        <Phone size={24} />
      </Button>
    </div>
  );
}