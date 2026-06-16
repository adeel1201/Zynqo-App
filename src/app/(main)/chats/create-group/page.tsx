"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/zynqo/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, ChevronLeft, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupPhotoFile(file);
      setGroupPhoto(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !formData.name.trim()) return;

    setIsLoading(true);
    let photoUrl = groupPhoto || `https://picsum.photos/seed/${Date.now()}/200/200`;

    try {
      // 1. Upload photo if selected
      if (groupPhotoFile && storage) {
        const storageRef = ref(storage, `groups/photos/${Date.now()}_${groupPhotoFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, groupPhotoFile);
        photoUrl = await getDownloadURL(uploadTask.ref);
      }

      // 2. Create group document
      const groupData = {
        type: 'group',
        groupName: formData.name.trim(),
        groupDescription: formData.description.trim(),
        groupPhoto: photoUrl,
        admins: [user.uid],
        participantIds: [user.uid],
        participantNames: [profile?.displayName || user.displayName || 'Owner'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: `Group "${formData.name.trim()}" created`,
          senderId: user.uid,
          timestamp: serverTimestamp()
        }
      };

      const chatsRef = collection(db, 'chats');
      const docRef = await addDoc(chatsRef, groupData);

      toast({
        title: "Group Created",
        description: `Welcome to ${formData.name}!`,
      });

      router.push(`/chats/${docRef.id}`);
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: 'chats',
        operation: 'create',
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl safe-top px-2 h-16 flex items-center border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground mr-2">
          <ChevronLeft size={24} />
        </Button>
        <h2 className="font-bold text-lg text-foreground">Create New Group</h2>
      </header>

      <div className="p-6 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-primary/20 bg-muted">
              <AvatarImage src={groupPhoto || ''} />
              <AvatarFallback className="bg-transparent text-primary/40">
                <Users size={64} />
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full cursor-pointer shadow-xl shadow-primary/30 hover:scale-110 transition-transform">
              <Camera size={20} />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Group Profile Photo</p>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 opacity-70">Group Name</Label>
            <Input 
              placeholder="e.g., Weekend Explorers" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-14 bg-muted border-border rounded-2xl focus-visible:ring-primary text-sm text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 opacity-70">Description (Optional)</Label>
            <Textarea 
              placeholder="What is this group about?" 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[120px] bg-muted border-border rounded-2xl focus-visible:ring-primary p-4 text-sm text-foreground"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-lg shadow-lg shadow-primary/20 text-white"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Create Group"}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest opacity-60">
              You'll be able to add members after creating the group
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}