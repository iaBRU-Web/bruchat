import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  contentId: string;
  contentType: "short" | "video";
  variant?: "light" | "dark";
}

export default function YoutubeEngagement({ contentId, contentType, variant = "light" }: Props) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  const loadLikes = async () => {
    const { count } = await supabase.from("youtube_likes" as any)
      .select("*", { count: "exact", head: true })
      .eq("content_type", contentType).eq("content_id", contentId);
    setLikes(count || 0);
    if (user) {
      const { data } = await supabase.from("youtube_likes" as any).select("id")
        .eq("content_type", contentType).eq("content_id", contentId).eq("user_id", user.id).maybeSingle();
      setLiked(!!data);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase.from("youtube_comments" as any).select("*")
      .eq("content_type", contentType).eq("content_id", contentId)
      .order("created_at", { ascending: false }).limit(100);
    const list = (data as any[]) || [];
    setComments(list);
    const ids = [...new Set(list.map(c => c.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };

  useEffect(() => { loadLikes(); loadComments(); /* eslint-disable-next-line */ }, [contentId, contentType]);

  const toggleLike = async () => {
    if (!user) { toast({ title: "Sign in to like", variant: "destructive" }); return; }
    if (liked) {
      await supabase.from("youtube_likes" as any).delete()
        .eq("content_type", contentType).eq("content_id", contentId).eq("user_id", user.id);
      setLiked(false); setLikes(l => Math.max(0, l - 1));
    } else {
      const { error } = await supabase.from("youtube_likes" as any)
        .insert({ user_id: user.id, content_type: contentType, content_id: contentId });
      if (!error) { setLiked(true); setLikes(l => l + 1); }
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim()) return;
    const { error } = await supabase.from("youtube_comments" as any)
      .insert({ user_id: user.id, content_type: contentType, content_id: contentId, content: newComment.trim() });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setNewComment(""); loadComments();
  };

  const btnBase = variant === "dark"
    ? "text-white/90 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-sm">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 ${btnBase} ${liked ? "!text-red-500" : ""}`}>
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          <span className="font-medium">{likes}</span>
        </button>
        <button onClick={() => setShowComments(s => !s)} className={`flex items-center gap-1.5 ${btnBase}`}>
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">{comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className={`mt-1 rounded-xl border p-3 max-h-80 overflow-y-auto ${variant === "dark" ? "bg-black/60 border-white/10 text-white" : "bg-card border-border"}`}>
          {user && (
            <div className="flex gap-2 mb-3">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addComment()}
                placeholder="Add a comment..."
                className={`flex-1 rounded-pill px-3 py-1.5 text-sm border ${variant === "dark" ? "bg-white/10 border-white/20 placeholder:text-white/50" : "bg-background border-border"}`}
              />
              <button onClick={addComment} className="p-2 bg-primary text-primary-foreground rounded-full"><Send className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {comments.length === 0 ? (
            <p className={`text-xs text-center py-3 ${variant === "dark" ? "text-white/60" : "text-muted-foreground"}`}>No comments yet — be first!</p>
          ) : comments.map(c => {
            const p = profiles[c.user_id];
            return (
              <div key={c.id} className="flex gap-2 mb-2 text-sm">
                {p?.avatar_url ? (
                  <img src={p.avatar_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs">{p?.display_name || p?.username || "User"}</div>
                  <div className="text-sm break-words">{c.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
