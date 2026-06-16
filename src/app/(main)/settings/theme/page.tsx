
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
  { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Optimized for low light' },
  { id: 'light', label: 'Light Mode', icon: Sun, desc: 'High contrast clarity' },
  { id: 'system', label: 'System Default', icon: Monitor, desc: 'Follow device settings' }
];

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const currentTheme = profile?.settings?.theme || 'dark';

  const handleUpdateTheme = async (themeId: string) => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.theme': themeId
      });
      toast({ title: `Theme set to ${themeId}` });
    } catch (err) {
      toast({ title: "Failed to update theme", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0E0C12] animate-fade-in pb-24">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center border-b border-white/5">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground mr-2">
          <ChevronLeft size={24} />
        </Button>
        <h2 className="font-bold text-lg">Appearance</h2>
      </header>

      <div className="p-4 space-y-8">
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
            <Palette size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Zynqo Aesthetics</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Personalize your visual experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {THEMES.map((theme) => {
            const isActive = currentTheme === theme.id;
            const Icon = theme.icon;

            return (
              <button
                key={theme.id}
                onClick={() => handleUpdateTheme(theme.id)}
                disabled={isLoading}
                className={cn(
                  "flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300",
                  isActive 
                    ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" 
                    : "bg-card/40 border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    isActive ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                  )}>
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={cn("text-sm font-bold", isActive ? "text-primary" : "text-foreground")}>{theme.label}</span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{theme.desc}</span>
                  </div>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-8 mt-4 bg-card/20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center text-center gap-4">
           <p className="text-xs text-muted-foreground leading-relaxed">
             Theme changes may require a session refresh to apply consistently across all components.
           </p>
           <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary h-8 px-4 text-[10px] font-black uppercase tracking-widest">
             Refresh App
           </Button>
        </div>
      </div>
    </div>
  );
}
