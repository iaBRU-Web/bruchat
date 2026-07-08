import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/posts/PostCard";
import Footer from "@/components/Footer";
import AdSense from "@/components/AdSense";

const PostDetail = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (!data) { setLoading(false); return; }

      const { data: profile } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", data.user_id).single();

      let isLiked = false, isSaved = false;
      if (user) {
        const { data: like } = await supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
        const { data: save } = await supabase.from("post_saves").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
        isLiked = !!like;
        isSaved = !!save;
      }

      setPost({ ...data, profile, isLiked, isSaved });
      setLoading(false);
    };
    fetchPost();
  }, [postId, user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-breathe text-primary">Loading...</div></div>;
  if (!post) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Post not found</p></div>;

  const headline = (post.content || "").slice(0, 110) || `Post by ${post.profile?.display_name || post.profile?.username || "BRUChat user"}`;
  const postUrl = `https://bru-msg.lovable.app/post/${post.id}`;
  const authorName = post.profile?.display_name || post.profile?.username || "BRUChat user";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${headline} — BRUChat`}</title>
        <meta name="description" content={(post.content || `Post by @${post.profile?.username || "bruchat"} on BRUChat.`).slice(0, 160)} />
        <link rel="canonical" href={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:title" content={headline} />
        <meta property="og:description" content={(post.content || "").slice(0, 200)} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SocialMediaPosting",
          headline,
          datePublished: post.created_at,
          author: { "@type": "Person", name: authorName },
          url: postUrl,
        })}</script>
      </Helmet>
      <main id="main" className="max-w-xl mx-auto px-4 py-6">
        <h1 className="sr-only">{headline}</h1>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
        </button>
        <PostCard post={post} currentUserId={user?.id || ""} onUpdate={() => window.location.reload()} />
        <AdSense />
      </main>
      <Footer />
    </div>
  );
};

export default PostDetail;
