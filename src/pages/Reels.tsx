import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";

const Reels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("posts")
        .select("*")
        .neq("video_url", "")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!data) return;
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles").select("id,username,display_name,avatar_url").in("id", userIds);
      const pmap = new Map(profiles?.map(p => [p.id, p]) || []);
      // Algorithmic ranking
      const now = Date.now();
      const ranked = data.map(p => {
        const ageH = (now - new Date(p.created_at).getTime()) / 3600000;
        const score = Math.log((p.likes_count || 0) + 1) * 3
          + Math.log((p.comments_count || 0) + 1) * 2
          + Math.max(0, 10 - ageH / 12);
        return { ...p, profile: pmap.get(p.user_id), _score: score };
      }).sort((a, b) => b._score - a._score);
      setReels(ranked);
    })();
  }, []);

  // Autoplay visible video
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = e.target.querySelector("video") as HTMLVideoElement | null;
        if (!v) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.6 });
    containerRef.current?.querySelectorAll("[data-reel]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [reels]);

  const like = async (postId: string) => {
    if (!user) return;
    await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    setReels(r => r.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
  };

  const share = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast({ title: "Link copied 🔗" });
  };

  return (
    <div className="h-screen bg-black relative">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 p-2 bg-white/10 backdrop-blur rounded-full text-white">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none">
        {reels.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/60">No reels yet 🎬</div>
        )}
        {reels.map(r => (
          <div key={r.id} data-reel className="h-screen snap-start relative flex items-center justify-center">
            <video src={r.video_url} loop playsInline muted={false} controls={false}
              className="max-h-full max-w-full" onClick={(e) => {
                const v = e.currentTarget; v.paused ? v.play() : v.pause();
              }} />
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
              <button onClick={() => like(r.id)} className="flex flex-col items-center">
                <Heart className="h-7 w-7" />
                <span className="text-xs mt-1">{r.likes_count || 0}</span>
              </button>
              <button onClick={() => navigate(`/post/${r.id}`)} className="flex flex-col items-center">
                <MessageCircle className="h-7 w-7" />
                <span className="text-xs mt-1">{r.comments_count || 0}</span>
              </button>
              <button onClick={() => share(r.id)}><Share2 className="h-7 w-7" /></button>
            </div>
            <div className="absolute left-4 right-20 bottom-6 text-white">
              <button onClick={() => navigate(`/user/${r.profile?.username}`)} className="flex items-center gap-2 mb-2">
                {r.profile?.avatar_url ? (
                  <img src={r.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" />
                ) : <div className="w-9 h-9 rounded-full bg-white/20" />}
                <span className="font-semibold flex items-center gap-1">@{r.profile?.username} <VerifiedBadge username={r.profile?.username} /></span>
              </button>
              {r.content && <p className="text-sm line-clamp-2">{r.content}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reels;
