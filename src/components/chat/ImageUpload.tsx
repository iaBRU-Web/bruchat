import { useState, useRef } from "react";
import { Image, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploadProps {
  onUpload: (url: string) => void;
  bucket?: string;
}

const ImageUpload = ({ onUpload, bucket = "chat-images" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Images only here 😅 That type won't work.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "That's too big for us 😬 Keep it under 5MB!", variant: "destructive" });
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const ext = file.name.split(".").pop();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      setUploading(false); setPreview(null); return;
    }
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;


    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast({ title: "Upload failed. Try again.", variant: "destructive" });
      setPreview(null);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    onUpload(publicUrl);
    setPreview(null);
    setUploading(false);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        onChange={handleSelect}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="text-muted-foreground hover:text-foreground p-2 transition-colors"
        title="Send image"
      >
        <Image className="h-4 w-4" />
      </button>

      {preview && (
        <div className="absolute bottom-full left-0 right-0 p-3 bg-card border-t border-border">
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-40 rounded-xl" />
            {uploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            <button
              onClick={() => { setPreview(null); setUploading(false); }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;
