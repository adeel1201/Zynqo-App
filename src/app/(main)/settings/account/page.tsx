
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useZynqoAuth } from '@/context/AuthContext';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, User, Mail, ShieldAlert, Download, Trash2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

export default function AccountManagementPage() {
  const router = useRouter();
  const { user, profile } = useZynqoAuth();
  const { toast } = useToast();

  const handleExportData = () => {
    toast({ title: "Data Export Initiated", description: "You will receive an email with your data archive shortly." });
  };

  const handleDeleteAccount = () => {
    toast({ title: "Account Deletion", description: "This feature is currently disabled for demo security.", variant: "destructive" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0E0C12] animate-fade-in pb-24">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center border-b border-white/5">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground mr-2">
          <ChevronLeft size={24} />
        </Button>
        <h2 className="font-bold text-lg">Account Management</h2>
      </header>

      <div className="p-4 space-y-6">
        <section className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Identity</h4>
          <div className="bg-card/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
            <AccountInfo icon={User} label="Display Name" value={profile?.displayName} />
            <AccountInfo icon={Mail} label="Email Address" value={user?.email} />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Security</h4>
          <div className="bg-card/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Key size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Change Password</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Last updated 3 months ago</p>
                </div>
              </div>
              <ChevronLeft size={16} className="text-muted-foreground/30 rotate-180" />
            </button>
            <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Two-Factor Authentication</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Highly Recommended</p>
                </div>
              </div>
              <span className="text-[8px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Disabled</span>
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Actions</h4>
          <div className="bg-card/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
            <button 
              onClick={handleExportData}
              className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-colors text-left border-b border-white/5"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground">
                <Download size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Export My Data</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Request a ZIP of your Zynqo history</p>
              </div>
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-4 p-5 hover:bg-destructive/5 transition-colors text-left">
                  <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                    <Trash2 size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-destructive">Delete Account</p>
                    <p className="text-[10px] text-destructive/60 uppercase font-bold tracking-widest mt-0.5">Permanently remove all your data</p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-white/10 rounded-[2rem]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel className="rounded-xl border-white/5 bg-white/5">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="rounded-xl bg-destructive hover:bg-destructive/90">
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountInfo({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-white/5 last:border-none">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground">
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{label}</span>
          <span className="text-sm font-medium">{value || 'Not Set'}</span>
        </div>
      </div>
    </div>
  );
}
