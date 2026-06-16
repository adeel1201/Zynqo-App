"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Palette, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'light', label: 'Light Mode', icon: Sun, desc: 'High contrast clarity' },
];

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const currentTheme = 'light';

  const handleUpdateTheme = async (themeId: string) => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.theme': 'light'
      });
      toast({ title: `Theme set to Light` });
    } catch (err) {
      toast({ title: "Failed to update theme", variant: "destructive" });
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
        <h2 className="font-bold text-lg text-foreground">Appearance</h2>
      </header>

      <div className="p-4 space-y-8">
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
            <Palette size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Zynqo Aesthetics</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Personalize your visual experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {THEMES.map((theme) => {
            const isActive = true;
            const Icon = theme.icon;

            return (
              <button
                key={theme.id}
                onClick={() => handleUpdateTheme(theme.id)}
                disabled={isLoading}
                className={cn(
                  "flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300",
                  "bg-primary/5 border-primary/40 shadow-sm"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors bg-primary text-white"
                  )}>
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-primary">{theme.label}</span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{theme.desc}</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check size={14} strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-8 mt-4 bg-muted/20 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center text-center gap-4">
           <p className="text-xs text-muted-foreground leading-relaxed">
             Theme is currently forced to Light Mode for visual consistency across Zynqo services.
           </p>
           <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary h-8 px-4 text-[9px] font-black uppercase tracking-widest">
             Check for Updates
           </Button>
        </div>
      </div>
    </div>
  );
}