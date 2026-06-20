"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Shield, Ghost, Eye, Lock, UserX, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const settings = profile?.settings || {};
  const privacy = settings.privacy || {};

  const handleUpdatePrivacy = async (key: string, value: any) => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`settings.privacy.${key}`]: value
      });
      toast({ title: "Privacy settings updated" });
    } catch (err) {
      toast({ title: "Failed to update settings", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGhostMode = async (value: boolean) => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hideLocation: value
      });
      toast({ title: value ? "Ghost Mode Enabled" : "Ghost Mode Disabled" });
    } catch (err) {
      toast({ title: "Failed to update Ghost Mode", variant: "destructive" });
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
        <h2 className="font-bold text-lg text-foreground">Privacy & Security</h2>
      </header>

      <div className="p-4 space-y-6">
        <section className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Visibility</h4>
          <div className="bg-card rounded-[2.5rem] border border-border divide-y divide-border shadow-sm overflow-hidden">
            <PrivacyToggle 
              icon={Ghost} 
              label="Ghost Mode" 
              description="Hide your location from discovery" 
              checked={profile?.hideLocation || false} 
              onCheckedChange={handleUpdateGhostMode}
              disabled={isLoading}
            />
            <PrivacyToggle 
              icon={Eye} 
              label="Read Receipts" 
              description="Let others know when you've seen their messages" 
              checked={privacy.readReceipts !== false} 
              onCheckedChange={(val: boolean) => handleUpdatePrivacy('readReceipts', val)}
              disabled={isLoading}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Management</h4>
          <div className="bg-card rounded-[2.5rem] border border-border divide-y divide-border shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-5 hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <UserX size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Blocked Users</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                    {privacy.blockedUserIds?.length || 0} Accounts Blocked
                  </p>
                </div>
              </div>
              <ChevronLeft size={16} className="text-muted-foreground/30 rotate-180" />
            </button>
            <button className="w-full flex items-center justify-between p-5 hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Reported Content</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">View your reports</p>
                </div>
              </div>
              <ChevronLeft size={16} className="text-muted-foreground/30 rotate-180" />
            </button>
          </div>
        </section>

        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20">
          <div className="flex gap-3 text-primary">
            <Shield size={20} className="shrink-0" />
            <div className="space-y-1">
              <h5 className="text-sm font-bold">End-to-End Encryption</h5>
              <p className="text-[11px] leading-relaxed opacity-80">
                Your messages and calls are secured with industry-standard encryption. Zynqo cannot read or listen to them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyToggle({ icon: Icon, label, description, checked, onCheckedChange, disabled }: any) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground font-medium">{description}</span>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
