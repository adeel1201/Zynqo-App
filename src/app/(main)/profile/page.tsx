"use client";

import { AppHeader } from '@/components/zynqo/AppHeader';
import { MOCK_CURRENT_USER } from '@/app/lib/zynqo-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  Lock, 
  Bell, 
  Database, 
  HelpCircle, 
  LogOut, 
  Edit3,
  Globe,
  QrCode
} from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="flex flex-col animate-fade-in bg-[#0E0C12]">
      <AppHeader title="Profile" showActions={false} showSearch={false} />
      
      {/* Hero Profile Section */}
      <div className="relative h-64 w-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-end justify-center pb-8 border-b border-white/10">
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-md rounded-2xl text-white">
            <QrCode size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-md rounded-2xl text-white">
            <Edit3 size={20} />
          </Button>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-background shadow-2xl">
              <AvatarImage src={MOCK_CURRENT_USER.avatar} />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-background rounded-full shadow-lg" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-headline font-bold">{MOCK_CURRENT_USER.displayName}</h2>
            <p className="text-xs text-primary font-medium tracking-widest uppercase mt-0.5">@{MOCK_CURRENT_USER.username}</p>
          </div>
        </div>
      </div>

      {/* Bio / Stats */}
      <div className="grid grid-cols-3 gap-2 p-6 -mt-6 z-10">
        {[
          { label: 'Friends', value: '1.2k' },
          { label: 'Moments', value: '458' },
          { label: 'Score', value: '25k' }
        ].map((stat, i) => (
          <div key={i} className="bg-card/80 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex flex-col items-center shadow-lg">
            <span className="text-lg font-headline font-bold text-foreground">{stat.value}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="px-6 pb-6 space-y-6">
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Account</h4>
          <div className="bg-card/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
            <ProfileMenuItem icon={User} label="Personal Information" />
            <ProfileMenuItem icon={Globe} label="Privacy & Visibility" />
            <ProfileMenuItem icon={Lock} label="Security & Verification" />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">App Settings</h4>
          <div className="bg-card/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
            <ProfileMenuItem icon={Bell} label="Notifications" />
            <ProfileMenuItem icon={Database} label="Data & Storage" />
            <ProfileMenuItem icon={HelpCircle} label="Help & Support" />
          </div>
        </div>

        <Button variant="ghost" className="w-full h-14 rounded-3xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2 font-bold mb-4 border border-destructive/20">
          <LogOut size={20} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function ProfileMenuItem({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary/80">
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-muted-foreground text-lg">›</span>
    </button>
  );
}