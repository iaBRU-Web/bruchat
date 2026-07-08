import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import YoutubeEngagement from "@/components/youtube/YoutubeEngagement";

const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
};

const YoutubeShorts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shorts, setShorts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase.from("youtube_shorts" as any).select("*").order("created_at", { ascending: false }).limit(100);
    setShorts((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!user) return;
    const id = extractYoutubeId(newUrl);
    if (!id) { toast({ title: "Invalid YouTube URL", variant: "destructive" }); return; }
    const { error } = await supabase.from("youtube_shorts" as any).insert({ user_id: user.id, url: id, title: newTitle });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setNewUrl(""); setNewTitle(""); setShowAdd(false); toast({ title: "Short added 🎬" }); load();
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? shorts.filter(s => (s.title || "").toLowerCase().includes(q) || (s.url || "").toLowerCase().includes(q))
    : shorts;

  const del = async (id: string) => {
    await supabase.from("youtube_shorts" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="h-screen bg-black relative">
      <button onClick={() => navigate("/youtube")} className="absolute top-4 left-4 z-20 p-2 bg-white/10 backdrop-blur rounded-full text-white">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button onClick={() => setShowAdd(true)} className="absolute top-4 right-4 z-20 p-2 bg-white/10 backdrop-blur rounded-full text-white">
        <Plus className="h-5 w-5" />
      </button>
      <button onClick={() => setShowSearch(s => !s)} className="absolute top-4 right-16 z-20 p-2 bg-white/10 backdrop-blur rounded-full text-white">
        <Search className="h-5 w-5" />
      </button>

      {showSearch && (
        <div className="absolute top-16 left-4 right-4 z-20">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shorts by title or ID..."
            autoFocus
            className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-pill px-4 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/15"
          />
        </div>
      )}

      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none">
        {filtered.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/60">
            {q ? `No shorts match "${search}"` : "No shorts yet — tap + to add 🎬"}
          </div>
        )}
        {filtered.map(s => (
          <div key={s.id} className="h-screen snap-start relative flex items-center justify-center">
            <iframe
              src={`https://www.youtube.com/embed/${s.url}?autoplay=0&playsinline=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full max-w-md h-[80vh] rounded-2xl border-0"
              title={s.title || "YouTube short"}
            />
            {s.title && (
              <div className="absolute bottom-24 left-6 right-20 max-w-md mx-auto text-white text-sm font-medium drop-shadow-lg line-clamp-2">
                {s.title}
              </div>
            )}
            <div className="absolute bottom-6 left-6 right-6 max-w-md mx-auto">
              <YoutubeEngagement contentId={s.id} contentType="short" variant="dark" />
            </div>
            {s.user_id === user?.id && (
              <button onClick={() => del(s.id)} className="absolute top-20 right-6 p-2 bg-red-500/80 rounded-full text-white">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-foreground">Add YouTube Short</h3>
              <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title (helps search)" className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm mb-2" />
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://youtube.com/shorts/..." className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm mb-3" />
            <button onClick={add} className="w-full bg-primary text-primary-foreground rounded-pill py-2 font-semibold text-sm">Add</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeShorts;
