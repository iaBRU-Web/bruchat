import { useState, useRef } from "react";
import { X, Image as ImageIcon, Video, Globe, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { compressImage, compressVideo } from "@/lib/compressMedia";

const DAILY_POST_LIMIT = 10;

const CreatePostModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (post: any) => void }) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast({ title: "Max 10 images per post 📸", variant: "destructive" });
      return;
    }
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast({ title: "Some images were too large (max 10MB each)", variant: "destructive" });
    }
    setImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Video must be under 100MB 🎬", variant: "destructive" });
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!content.trim() && images.length === 0 && !videoFile) return;
    if (content.length > 2000) {
      toast({ title: "Keep it under 2000 characters 😅", variant: "destructive" });
      return;
    }
    if (!user) return;

    setCreating(true);
    try {
      // Daily post limit check (admin can override via post_limit_override)
      const { data: prof } = await supabase.from("profiles").select("post_limit_override").eq("id", user.id).maybeSingle();
      const limit = (prof as any)?.post_limit_override ?? DAILY_POST_LIMIT;
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dayStart.toISOString());
      if ((count ?? 0) >= limit) {
        toast({ title: `Daily limit reached (${limit} posts/day) ⏰`, variant: "destructive" });
        setCreating(false); return;
      }

      // Compress + upload images
      const imageUrls: string[] = [];
      if (images.length) toast({ title: "Compressing images... 📸" });
      for (const raw of images) {
        const img = await compressImage(raw);
        const ext = img.name.split(".").pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("posts").upload(path, img, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // Compress + upload video
      let videoUrl = "";
      if (videoFile) {
        toast({ title: "Uploading video... 🎬" });
        const vid = await compressVideo(videoFile);
        const ext = vid.name.split(".").pop();
        const path = `${user.id}/vid_${Date.now()}.${ext}`;
        const { error: vErr } = await supabase.storage.from("posts").upload(path, vid, { upsert: true });
        if (!vErr) {
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
          videoUrl = urlData.publicUrl;
        }
      }

      const postType = imageUrls.length > 0 ? "image" : videoUrl ? "video" : "text";

      const { data: newPost, error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        image_urls: imageUrls,
        video_url: videoUrl,
        post_type: postType,
        is_public: isPublic,
      }).select().single();

      if (error) throw new Error(error.message);

      toast({ title: "Post shared! 🎉" });
      onCreated(newPost);
      onClose();
    } catch (err: any) {
      toast({ title: err.message || "Could not create post. Try again 😅", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const firstName = profile?.display_name?.split(" ")[0] || "you";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-heading font-bold text-foreground">Create Post</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`What's on your mind, ${firstName}? 💭`}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[100px] focus:outline-none border-none !p-0 !border-0"
              maxLength={2000}
              style={{ border: 'none', padding: 0, background: 'transparent' }}
            />
          </div>

          {content.length > 1500 && (
            <p className={`text-xs text-right ${content.length > 2000 ? "text-destructive" : "text-muted-foreground"}`}>
              {content.length}/2000
            </p>
          )}

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video preview */}
          {videoPreview && (
            <div className="relative">
              <video src={videoPreview} controls className="w-full rounded-xl max-h-[200px]" />
              <button onClick={() => { setVideoFile(null); setVideoPreview(""); }} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImages} />
            <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideo} />
            <button onClick={() => imageInputRef.current?.click()} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <ImageIcon className="h-5 w-5" />
            </button>
            <button onClick={() => videoInputRef.current?.click()} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Video className="h-5 w-5" />
            </button>
            <button onClick={() => setIsPublic(!isPublic)} className="flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors">
              {isPublic ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCreate}
              disabled={creating || (!content.trim() && images.length === 0 && !videoFile)}
              className={`px-6 py-2 rounded-pill text-sm font-semibold transition-all ${
                content.trim() || images.length > 0 || videoFile
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--bruchat-accent-glow)/0.4)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {creating ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Posting...</> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
