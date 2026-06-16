"use client";

import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/zynqo/AppHeader';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Languages, 
  Database, 
  HelpCircle, 
  ChevronRight,
  ChevronLeft,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground mr-2">
          <ChevronLeft size={24} />
        </Button>
        <h2 className="font-bold text-lg text-foreground">Settings</h2>
      </header>

      <div className="p-4 space-y-6">
        <section className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Personal</h4>
          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <SettingsItem icon={User} label="Account Management" href="/settings/account" />
            <SettingsItem icon={Lock} label="Security & Verification" href="/settings/security" />
            <SettingsItem icon={Shield} label="Privacy & Visibility" href="/settings/privacy" />
            <SettingsItem icon={Bell} label="Notifications" href="/settings/notifications" />
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">App Preferences</h4>
          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <SettingsItem icon={Palette} label="Appearance & Theme" href="/settings/theme" />
            <SettingsItem icon={Languages} label="Language" href="/settings/language" />
            <SettingsItem icon={Database} label="Data & Storage" href="/settings/data" />
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Support</h4>
          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <SettingsItem icon={HelpCircle} label="Help Center" href="#" />
            <div className="p-4 border-b border-border last:border-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <span className="text-[10px] font-black">V</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Zynqo Version</span>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">1.2.0 (Stable Amethyst)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border last:border-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={20} />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <ChevronRight size={16} className="text-muted-foreground/30" />
    </Link>
  );
}