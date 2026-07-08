import { useRef } from "react";
import { Image, Video, Music, FileText, Package, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AttachmentMenuProps {
  onClose: () => void;
  onFileSent: (msg: { content: string; message_type: string; image_url?: string; audio_url?: string; video_url?: string; file_url?: string; file_name?: string; file_size?: number; file_type?: string }) => void;
}

const FILE_CONFIGS = [
  { key: "photo", icon: Image, label: "Photo", accept: ".jpg,.jpeg,.png,.gif,.webp", maxMB: 5, bucket: "chat-images", type: "image" },
  { key: "video", icon: Video, label: "Video", accept: ".mp4,.webm,.mov", maxMB: 50, bucket: "videos", type: "video" },
  { key: "audio", icon: Music, label: "Audio", accept: ".mp3,.wav,.ogg,.m4a", maxMB: 20, bucket: "audio-messages", type: "audio" },
  { key: "document", icon: FileText, label: "Document", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt", maxMB: 20, bucket: "files", type: "file" },
  { key: "file", icon: Package, label: "File", accept: "*", maxMB: 50, bucket: "files", type: "file" },
];

const AttachmentMenu = ({ onClose, onFileSent }: AttachmentMenuProps) => {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = async (file: File, config: typeof FILE_CONFIGS[0]) => {
    if (file.size > config.maxMB * 1024 * 1024) {
      toast({ title: `File too large. Max ${config.maxMB}MB 😅`, variant: "destructive" });
      return;
    }

    const ext = file.name.split(".").pop();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;


    const { error } = await supabase.storage.from(config.bucket).upload(path, file, { cacheControl: "3600" });
    if (error) {
      toast({ title: "Upload failed. Try again 😅", variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(config.bucket).getPublicUrl(path);

    const msg: any = {
      content: config.type === "image" ? "📷 Image" : config.type === "video" ? "🎬 Video" : config.type === "audio" ? "🎵 Audio" : `📄 ${file.name}`,
      message_type: config.type,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    };

    if (config.type === "image") msg.image_url = publicUrl;
    else if (config.type === "video") msg.video_url = publicUrl;
    else if (config.type === "audio") msg.audio_url = publicUrl;
    else msg.file_url = publicUrl;

    onFileSent(msg);
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-2xl shadow-xl p-3 z-20 animate-slide-up-fade">
      <div className="grid grid-cols-3 gap-2">
        {FILE_CONFIGS.map((cfg) => (
          <div key={cfg.key}>
            <input
              ref={(el) => { fileRefs.current[cfg.key] = el; }}
              type="file"
              accept={cfg.accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f, cfg);
              }}
            />
            <button
              onClick={() => fileRefs.current[cfg.key]?.click()}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors w-full"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <cfg.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] text-foreground font-medium">{cfg.label}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentMenu;
