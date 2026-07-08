import VerifiedBadge from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { Heart, Reply, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  likes_count: number;
  reply_to_id: string | null;
  created_at: string;
  profile?: { display_name: string; avatar_url: string; username: string };
  isLiked?: boolean;
}

const formatTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const PostComments = ({ postId, postOwnerId, currentUserId }: { postId: string; postOwnerId: string; currentUserId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,username")
        .in("id", userIds);
      const pMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const { data: myLikes } = await supabase
        .from("post_comment_likes")
        .select("comment_id")
        .eq("user_id", currentUserId)
        .in("comment_id", data.map(c => c.id));
      const likedSet = new Set(myLikes?.map(l => l.comment_id) || []);

      setComments(data.map(c => ({
        ...c,
        profile: pMap.get(c.user_id),
        isLiked: likedSet.has(c.id),
      })));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) {
      toast({ title: "Say something first 💬", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: newComment.trim(),
      reply_to_id: replyTo?.id || null,
    });
    if (!error) {
      setNewComment("");
      setReplyTo(null);
      fetchComments();
      if (postOwnerId !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: postOwnerId,
          type: "post_comment",
          from_user_id: currentUserId,
        });
      }
    }
  };

  const toggleCommentLike = async (comment: Comment) => {
    if (comment.isLiked) {
      await supabase.from("post_comment_likes").delete().eq("comment_id", comment.id).eq("user_id", currentUserId);
    } else {
      await supabase.from("post_comment_likes").insert({ comment_id: comment.id, user_id: currentUserId });
    }
    fetchComments();
  };

  const displayed = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="border-t border-border/50 px-4 py-3">
      {displayed.map(c => (
        <div key={c.id} className={`flex gap-2 mb-3 ${c.reply_to_id ? "ml-8" : ""}`}>
          <div className="flex-shrink-0">
            {c.profile?.avatar_url ? (
              <img src={c.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {c.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-muted rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">{c.profile?.display_name} <VerifiedBadge username={c.profile?.username} /></p>
              <p className="text-xs text-foreground mt-0.5">{c.content}</p>
            </div>
            <div className="flex items-center gap-3 mt-0.5 px-1">
              <span className="text-[10px] text-muted-foreground">{formatTime(c.created_at)}</span>
              <button onClick={() => toggleCommentLike(c)} className={`text-[10px] font-medium ${c.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
                {c.likes_count > 0 ? `${c.likes_count} ` : ""}Like
              </button>
              <button onClick={() => setReplyTo(c)} className="text-[10px] font-medium text-muted-foreground hover:text-primary">
                Reply
              </button>
            </div>
          </div>
        </div>
      ))}

      {comments.length > 3 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-primary font-medium mb-3">
          View all {comments.length} comments
        </button>
      )}

      {/* Comment input */}
      {replyTo && (
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-primary">Replying to {replyTo.profile?.display_name}</span>
          <button onClick={() => setReplyTo(null)} className="text-[10px] text-muted-foreground">✕</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submitComment()}
          placeholder="Add a comment..."
          className="flex-1 text-xs bg-muted rounded-pill px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          maxLength={500}
        />
        <button onClick={submitComment} disabled={!newComment.trim()} className="text-primary disabled:text-muted-foreground">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PostComments;
