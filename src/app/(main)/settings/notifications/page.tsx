"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Bell, MessageSquare, Phone, LayoutGrid, Radio, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const settings = profile?.settings || {};
  const notifications = settings.notifications || {
    messages: true,
    calls: true,
    moments: true,
    channels: true,
    security: true
  };

  const handleToggle = async (key: string, value: boolean) => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`settings.notifications.${key}`]: value
      });
      toast({ title: "Notification preference saved" });
    } catch (err) {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground mr-2">
          <ChevronLeft size={24} />
        </Button>
        <h2 className="font-bold text-lg text-foreground">Notifications</h2>
      </header>

      <div className="p-4 space-y-8">
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Bell size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Push Notifications</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Control your alerts</p>
          </div>
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border divide-y divide-border shadow-sm overflow-hidden">
          <NotifyRow 
            icon={MessageSquare} 
            label="Messages" 
            checked={notifications.messages} 
            onCheckedChange={(v: boolean) => handleToggle('messages', v)} 
            disabled={isLoading}
          />
          <NotifyRow 
            icon={Phone} 
            label="Calls" 
            checked={notifications.calls} 
            onCheckedChange={(v: boolean) => handleToggle('calls', v)} 
            disabled={isLoading}
          />
          <NotifyRow 
            icon={LayoutGrid} 
            label="Moments" 
            checked={notifications.moments} 
            onCheckedChange={(v: boolean) => handleToggle('moments', v)} 
            disabled={isLoading}
          />
          <NotifyRow 
            icon={Radio} 
            label="Channels" 
            checked={notifications.channels} 
            onCheckedChange={(v: boolean) => handleToggle('channels', v)} 
            disabled={isLoading}
          />
          <NotifyRow 
            icon={ShieldCheck} 
            label="Security Alerts" 
            checked={notifications.security !== false} 
            onCheckedChange={(v: boolean) => handleToggle('security', v)} 
            disabled={isLoading}
          />
        </div>

        <div className="px-6 py-4 bg-muted/30 rounded-2xl border border-border">
           <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic text-center">
             Note: System-wide critical alerts cannot be disabled for your security.
           </p>
        </div>
      </div>
    </div>
  );
}

function NotifyRow({ icon: Icon, label, checked, onCheckedChange, disabled }: any) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-primary/70">
          <Icon size={20} />
        </div>
        <span className="text-sm font-bold text-foreground">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}