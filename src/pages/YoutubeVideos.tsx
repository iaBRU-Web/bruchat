import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Search, Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import YoutubeEngagement from "@/components/youtube/YoutubeEngagement";

const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
};

const YoutubeVideos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("youtube_videos" as any).select("*").order("created_at", { ascending: false }).limit(200);
    setVideos((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!user) return;
    const id = extractYoutubeId(newUrl);
    if (!id) { toast({ title: "Invalid YouTube URL", variant: "destructive" }); return; }
    if (!newTitle.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const { error } = await supabase.from("youtube_videos" as any).insert({
      user_id: user.id, url: id, title: newTitle.trim(), description: newDesc.trim()
    });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setNewUrl(""); setNewTitle(""); setNewDesc(""); setShowAdd(false);
    toast({ title: "Video added 🎥" }); load();
  };

  const del = async (id: string) => {
    await supabase.from("youtube_videos" as any).delete().eq("id", id);
    load();
  };

  const filtered = videos.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.title?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/youtube")} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground flex-1">YouTube Videos</h1>
          <button onClick={() => setShowAdd(true)} className="p-2 bg-primary text-primary-foreground rounded-full"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos..." className="w-full pl-10 pr-3 py-2 bg-card border border-border rounded-pill text-sm" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No videos {search ? "match your search" : "yet"} 🎥</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <div key={v.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="aspect-video relative bg-black">
                  {playing === v.id ? (
                    <iframe src={`https://www.youtube.com/embed/${v.url}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full border-0" title={v.title} />
                  ) : (
                    <button onClick={() => setPlaying(v.id)} className="w-full h-full relative group">
                      <img src={`https://img.youtube.com/vi/${v.url}/hqdefault.jpg`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center"><Play className="h-6 w-6 text-white fill-white ml-1" /></div>
                      </div>
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2">{v.title}</h3>
                  {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}
                  <div className="mt-2"><YoutubeEngagement contentId={v.id} contentType="video" /></div>
                  {v.user_id === user?.id && (
                    <button onClick={() => del(v.id)} className="mt-2 text-xs text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-foreground">Add YouTube Video</h3>
              <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm" />
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm resize-none" />
              <button onClick={add} className="w-full bg-primary text-primary-foreground rounded-pill py-2 font-semibold text-sm">Add Video</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default YoutubeVideos;
