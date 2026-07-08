import { useState, useRef } from "react";
import { X, Upload, Palette, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GRADIENT_PRESETS = [
  { name: "Sunset", value: "linear-gradient(135deg, #f97316, #ec4899)" },
  { name: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { name: "Forest", value: "linear-gradient(135deg, #22c55e, #0ea5e9)" },
  { name: "Candy", value: "linear-gradient(135deg, #ec4899, #a855f7)" },
  { name: "Midnight", value: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { name: "Fire", value: "linear-gradient(135deg, #ef4444, #f97316)" },
  { name: "Aurora", value: "linear-gradient(135deg, #00d4ff, #00e676)" },
  { name: "Rose Gold", value: "linear-gradient(135deg, #f43f5e, #fb923c)" },
  { name: "Purple Rain", value: "linear-gradient(135deg, #7c3aed, #4f46e5)" },
  { name: "Teal Wave", value: "linear-gradient(135deg, #0d9488, #0ea5e9)" },
  { name: "Gold Rush", value: "linear-gradient(135deg, #ca8a04, #f97316)" },
  { name: "Berry", value: "linear-gradient(135deg, #9333ea, #ec4899)" },
  { name: "Arctic", value: "linear-gradient(135deg, #e0f2fe, #bae6fd)" },
  { name: "Lava", value: "linear-gradient(135deg, #dc2626, #7f1d1d)" },
  { name: "Mint", value: "linear-gradient(135deg, #34d399, #6ee7b7)" },
  { name: "Dusk", value: "linear-gradient(135deg, #6366f1, #ec4899)" },
  { name: "Copper", value: "linear-gradient(135deg, #b45309, #d97706)" },
  { name: "Sage", value: "linear-gradient(135deg, #4ade80, #a3e635)" },
  { name: "Storm", value: "linear-gradient(135deg, #475569, #1e293b)" },
  { name: "BRU", value: "linear-gradient(135deg, #00d4ff, #1a1a2a)" },
];

const SOLID_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#78716c",
  "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8",
  "#fbbf24", "#a3e635", "#2dd4bf", "#38bdf8", "#818cf8", "#c084fc",
];

interface BannerPickerProps {
  userId: string;
  onClose: () => void;
  onUpdate: (bannerUrl: string) => void;
}

const BannerPicker = ({ userId, onClose, onUpdate }: BannerPickerProps) => {
  const [tab, setTab] = useState<"upload" | "gradient" | "solid">("gradient");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Banner image must be under 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/banner.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("banners").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("profiles").update({ banner_url: url }).eq("id", userId);
      onUpdate(url);
      toast({ title: "Background updated! ✨" });
      onClose();
    }
    setUploading(false);
  };

  const selectGradient = async (value: string) => {
    await supabase.from("profiles").update({ banner_url: value }).eq("id", userId);
    onUpdate(value);
    toast({ title: "Background updated! ✨" });
    onClose();
  };

  const selectColor = async (hex: string) => {
    await supabase.from("profiles").update({ banner_url: hex }).eq("id", userId);
    onUpdate(hex);
    toast({ title: "Background updated! ✨" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-heading font-bold text-foreground">Change Background</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-border">
          {([["upload", Upload, "Upload"], ["gradient", Palette, "Gradients"], ["solid", Square, "Colors"]] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                tab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "upload" && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-center"
              >
                {uploading ? "Uploading..." : "Click to upload a banner image"}
                <p className="text-xs mt-1">JPG, PNG, WebP · Max 5MB</p>
              </button>
            </div>
          )}

          {tab === "gradient" && (
            <div className="grid grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map(g => (
                <button
                  key={g.name}
                  onClick={() => selectGradient(g.value)}
                  className="aspect-square rounded-xl hover:ring-2 hover:ring-primary transition-all"
                  style={{ background: g.value }}
                  title={g.name}
                />
              ))}
            </div>
          )}

          {tab === "solid" && (
            <div className="grid grid-cols-6 gap-2">
              {SOLID_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => selectColor(c)}
                  className="aspect-square rounded-xl hover:ring-2 hover:ring-primary transition-all"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerPicker;
