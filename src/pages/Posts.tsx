import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/chat/AppSidebar";
import Footer from "@/components/Footer";
import PostCard from "@/components/posts/PostCard";
import CreatePostModal from "@/components/posts/CreatePostModal";
import AdSense from "@/components/AdSense";

const Posts = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (!user) return;
    const limit = 20;

    // Algorithmic feed: pull recent posts from last 14d, score & rank
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

    const { data: follows } = await supabase
      .from("follows").select("following_id").eq("follower_id", user.id);
    const followSet = new Set((follows || []).map(f => f.following_id));

    const { data: verified } = await supabase
      .from("verified_users").select("user_id");
    const verifiedSet = new Set((verified || []).map(v => v.user_id));

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_public", true)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (data) {
      const now = Date.now();
      const ranked = data.map((p: any) => {
        const ageH = (now - new Date(p.created_at).getTime()) / 3600000;
        const recency = Math.max(0, 10 - ageH / 12);
        const score =
          Math.log((p.likes_count || 0) + 1) * 3 +
          Math.log((p.comments_count || 0) + 1) * 2 +
          recency +
          (followSet.has(p.user_id) ? 5 : 0) +
          (verifiedSet.has(p.user_id) ? 2 : 0) +
          (p.user_id === user.id ? 4 : 0);
        return { ...p, _score: score };
      }).sort((a: any, b: any) => b._score - a._score);

      const pageSlice = ranked.slice(pageNum * limit, (pageNum + 1) * limit);

      const userIds = [...new Set(pageSlice.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles").select("id,username,display_name,avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      const postIds = pageSlice.map((p: any) => p.id);
      const { data: myLikes } = await supabase.from("post_likes")
        .select("post_id").eq("user_id", user.id).in("post_id", postIds);
      const likedSet = new Set(myLikes?.map(l => l.post_id) || []);

      const { data: mySaves } = await supabase.from("post_saves")
        .select("post_id").eq("user_id", user.id).in("post_id", postIds);
      const savedSet = new Set(mySaves?.map(s => s.post_id) || []);

      const enriched = pageSlice.map((p: any) => ({
        ...p,
        profile: profileMap.get(p.user_id),
        isLiked: likedSet.has(p.id),
        isSaved: savedSet.has(p.id),
      }));

      if (append) setPosts(prev => [...prev, ...enriched]);
      else setPosts(enriched);
      setHasMore(pageSlice.length === limit);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
      }
    }, { threshold: 0.5 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  const handlePostCreated = (newPost: any) => {
    setPosts(prev => [{ ...newPost, profile: { id: profile?.id, username: profile?.username, display_name: profile?.display_name, avatar_url: profile?.avatar_url }, isLiked: false, isSaved: false }, ...prev]);
  };

  return (
    <div className="h-screen bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-xl mx-auto px-4 py-6">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Posts</h1>

          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-2 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-muted-foreground">No posts yet. Follow people or create your first post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <div key={post.id}>
                  <PostCard
                    post={post}
                    currentUserId={user?.id || ""}
                    onUpdate={() => fetchPosts(0)}
                  />
                  {(idx + 1) % 5 === 0 && <AdSense key={`ad-${idx}`} />}
                </div>
              ))}
              {hasMore && <div ref={loaderRef} className="py-4 text-center text-muted-foreground text-sm">Loading more...</div>}
            </div>
          )}
        </div>
        <Footer />
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-20 md:bottom-8 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 transition-all z-40"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={handlePostCreated}
        />
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AppSidebar mobile />
      </div>
    </div>
  );
};

export default Posts;
