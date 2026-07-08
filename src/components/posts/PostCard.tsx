import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2, Pencil, Flag, UserMinus, Link2, Repeat2 } from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PostComments from "./PostComments";
import PostImageGrid from "./PostImageGrid";
import VerifiedBadge from "@/components/VerifiedBadge";


const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
};

interface PostCardProps {
  post: any;
  currentUserId: string;
  onUpdate: () => void;
}

const PostCard = ({ post, currentUserId, onUpdate }: PostCardProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(post.isSaved);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const isOwn = post.user_id === currentUserId;
  const images = Array.isArray(post.image_urls) ? post.image_urls.filter(Boolean) : [];

  const toggleLike = async () => {
    if (liked) {
      setLiked(false);
      setLikesCount((c: number) => c - 1);
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
    } else {
      setLiked(true);
      setLikesCount((c: number) => c + 1);
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      // Notification
      if (post.user_id !== currentUserId) {
        await supabase.from("notifications").insert({ user_id: post.user_id, type: "post_like", from_user_id: currentUserId });
      }
    }
  };

  const toggleSave = async () => {
    if (saved) {
      setSaved(false);
      await supabase.from("post_saves").delete().eq("post_id", post.id).eq("user_id", currentUserId);
    } else {
      setSaved(true);
      await supabase.from("post_saves").insert({ post_id: post.id, user_id: currentUserId });
      toast({ title: "Post saved! 🔖" });
    }
  };

  const sharePost = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast({ title: "Post link copied! 🔗" });
  };

  const repost = async () => {
    if (post.user_id === currentUserId) { toast({ title: "Can't repost your own post 😅" }); return; }
    const { error } = await supabase.from("posts").insert({
      user_id: currentUserId,
      content: post.content || "",
      image_urls: post.image_urls || [],
      video_url: post.video_url || "",
      post_type: post.post_type || "text",
      is_public: true,
      reposted_from_id: post.reposted_from_id || post.id,
    } as any);
    if (error) toast({ title: error.message, variant: "destructive" });
    else { toast({ title: "Reposted ♻️" }); onUpdate(); }
  };

  const deletePost = async () => {
    await supabase.from("posts").delete().eq("id", post.id);
    toast({ title: "Post deleted. Gone forever 🗑️" });
    onUpdate();
  };

  const handleDoubleTap = () => {
    if (!liked) toggleLike();
  };

  const formatContent = (text: string) => {
    if (!text) return "";
    // Escape first so any HTML in user content is rendered as text
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const escaped = escape(text);
    return escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) => {
        const safeUrl = /^\s*javascript:/i.test(url) ? "#" : url;
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-primary font-semibold italic hover:underline">${url}</a>`;
      },
    );
  };


  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {post.reposted_from_id && (
        <div className="px-4 pt-3 -mb-1 text-xs text-muted-foreground flex items-center gap-1">
          <Repeat2 className="h-3 w-3" /> Reposted
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(`/user/${post.profile?.username}`)} className="flex-shrink-0">
          {post.profile?.avatar_url ? (
            <img src={post.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {post.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate(`/user/${post.profile?.username}`)} className="text-left">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">{post.profile?.display_name} <VerifiedBadge username={post.profile?.username} /></p>
            <p className="text-xs text-muted-foreground">@{post.profile?.username} · {formatTime(post.created_at)}</p>
          </button>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
              {isOwn ? (
                <>
                  <button onClick={deletePost} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                  <button onClick={sharePost} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <Link2 className="h-3.5 w-3.5" /> Copy link
                  </button>
                </>
              ) : (
                <>
                  <button onClick={sharePost} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <Link2 className="h-3.5 w-3.5" /> Copy link
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <Flag className="h-3.5 w-3.5" /> Report
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-2">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatContent(post.content), { ALLOWED_TAGS: ["a"], ALLOWED_ATTR: ["href", "target", "rel", "class"] }) }} />
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div onDoubleClick={handleDoubleTap} className="cursor-pointer">
          <PostImageGrid images={images} />
        </div>
      )}

      {/* Video */}
      {post.video_url && (
        <div className="px-4 pb-2">
          <video src={post.video_url} controls className="w-full rounded-xl max-h-[400px]" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className="flex items-center gap-1.5 group">
            <Heart className={`h-5 w-5 transition-all ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-400"} ${likeAnimating ? "scale-125" : "scale-100"}`} />
            <span className={`text-xs font-medium ${liked ? "text-red-500" : "text-muted-foreground"}`}>{likesCount || ""}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 group">
            <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium text-muted-foreground">{post.comments_count || ""}</span>
          </button>
          <button onClick={sharePost} className="group">
            <Share2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <button onClick={repost} className="group" title="Repost">
            <Repeat2 className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
          </button>
        </div>
        <button onClick={toggleSave}>
          <Bookmark className={`h-5 w-5 transition-colors ${saved ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
        </button>
      </div>

      {/* Like text */}
      {likesCount > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground">
            {liked ? `You and ${likesCount - 1 > 0 ? `${likesCount - 1} others` : ""}` : `${likesCount}`} {likesCount === 1 && !liked ? "like" : "likes"}
          </p>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <PostComments postId={post.id} postOwnerId={post.user_id} currentUserId={currentUserId} />
      )}
    </div>
  );
};

export default PostCard;
