import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, Share, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import BannerPicker from "@/components/profile/BannerPicker";
import ProfileCompleteness from "@/components/profile/ProfileCompleteness";
import PostCard from "@/components/posts/PostCard";
import VerifiedBadge from "@/components/VerifiedBadge";

const UserProfile = () => {
  const { username } = useParams();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"posts" | "info">("posts");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isOwn = profile?.id === user?.id;

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!p) { setLoading(false); return; }
      setProfile(p);

      if (user && p.id !== user.id) {
        await supabase.from("profiles").update({ profile_views: (p.profile_views || 0) + 1 }).eq("id", p.id);
      }

      const { count: followers } = await supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", p.id);
      const { count: followingC } = await supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", p.id);
      setFollowerCount(followers ?? 0);
      setFollowingCount(followingC ?? 0);

      if (user) {
        const { data: f } = await supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", p.id).maybeSingle();
        setIsFollowing(!!f);
      }

      // Fetch posts
      const isOwnProfile = user?.id === p.id;
      let postQuery = supabase.from("posts").select("*").eq("user_id", p.id).order("created_at", { ascending: false }).limit(20);
      if (!isOwnProfile) {
        postQuery = postQuery.eq("is_public", true);
      }
      const { data: userPosts } = await postQuery;
      if (userPosts) {
        const profileData = { id: p.id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url };
        let likedSet = new Set<string>();
        let savedSet = new Set<string>();
        if (user) {
          const pIds = userPosts.map(pp => pp.id);
          if (pIds.length > 0) {
            const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", pIds);
            likedSet = new Set(likes?.map(l => l.post_id) || []);
            const { data: saves } = await supabase.from("post_saves").select("post_id").eq("user_id", user.id).in("post_id", pIds);
            savedSet = new Set(saves?.map(s => s.post_id) || []);
          }
        }
        setPosts(userPosts.map(pp => ({ ...pp, profile: profileData, isLiked: likedSet.has(pp.id), isSaved: savedSet.has(pp.id) })));
        setPostCount(userPosts.length);
      }

      setLoading(false);
    };
    fetchProfile();
  }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      await supabase.from("notifications").insert({ user_id: profile.id, type: "follow", from_user_id: user.id });
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_a.eq.${user.id},participant_b.eq.${profile.id}),and(participant_a.eq.${profile.id},participant_b.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      navigate(`/app/${existing.id}`);
    } else {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({ participant_a: user.id, participant_b: profile.id })
        .select("id")
        .single();
      if (newConvo) navigate(`/app/${newConvo.id}`);
    }
  };

  const shareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/user/${username}`);
    toast({ title: "Profile link copied! 🔗" });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Max 2MB for profile picture", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);

      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setProfile((prev: any) => ({ ...prev, avatar_url: url }));
      await refreshProfile();
      toast({ title: "Profile picture updated! 📸" });
    }
    setUploadingAvatar(false);
  };

  const getBannerStyle = (bannerUrl: string | null, username: string) => {
    if (!bannerUrl || bannerUrl === "") {
      const hash = username.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      return { background: `linear-gradient(135deg, hsl(${hash % 360}, 70%, 50%), hsl(${(hash * 7) % 360}, 60%, 40%))` };
    }
    if (bannerUrl.startsWith("linear-gradient") || bannerUrl.startsWith("#")) {
      return { background: bannerUrl.startsWith("#") ? bannerUrl : bannerUrl };
    }
    return { background: `url(${bannerUrl}) center/cover` };
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-breathe text-primary text-lg font-heading">Loading profile...</div></div>;
  if (!profile) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">User not found</p></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{`${profile.display_name} (@${profile.username}) — BRUChat`}</title>
        <meta name="description" content={(profile.bio || `${profile.display_name}'s profile on BRUChat.`).slice(0, 160)} />
        <link rel="canonical" href={`https://bru-msg.lovable.app/user/${profile.username}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://bru-msg.lovable.app/user/${profile.username}`} />
        <meta property="og:title" content={`${profile.display_name} (@${profile.username})`} />
        <meta property="og:description" content={(profile.bio || `${profile.display_name} on BRUChat`).slice(0, 200)} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: profile.display_name,
            alternateName: profile.username,
            image: profile.avatar_url || undefined,
            description: profile.bio || undefined,
            url: `https://bru-msg.lovable.app/user/${profile.username}`,
          },
        })}</script>
      </Helmet>
      {/* Banner */}
      <div className="relative h-40 md:h-52" style={getBannerStyle(profile.banner_url, profile.username)}>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="absolute top-4 left-4 w-8 h-8 rounded-full bg-background/50 backdrop-blur flex items-center justify-center text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {isOwn && (
          <button onClick={() => setShowBannerPicker(true)} aria-label="Edit cover banner" className="absolute top-4 right-4 px-3 py-1.5 rounded-pill bg-background/50 backdrop-blur text-foreground text-xs font-medium flex items-center gap-1 hover:bg-background/70 transition-colors">
            <Camera className="h-3 w-3" aria-hidden="true" /> Edit Cover
          </button>
        )}
      </div>

      {/* Profile info */}
      <div className="max-w-2xl mx-auto w-full px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative">
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarUpload} />
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className={`w-20 h-20 rounded-full border-4 border-background object-cover ${isOwn ? "cursor-pointer" : ""} ${uploadingAvatar ? "opacity-50" : ""}`}
                onClick={() => isOwn && avatarInputRef.current?.click()}
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold ${isOwn ? "cursor-pointer" : ""}`}
                onClick={() => isOwn && avatarInputRef.current?.click()}
              >
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
            {isOwn && !uploadingAvatar && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background"
              >
                <Camera className="h-3 w-3" />
              </button>
            )}
            {profile.is_online && profile.show_online_status && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-bruchat-online border-2 border-background animate-pulse-online" />
            )}
          </div>
          {isOwn && (
            <ProfileCompleteness profile={profile} postCount={postCount} followerCount={followerCount} />
          )}
        </div>

        <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-1.5">{profile.display_name} <VerifiedBadge username={profile.username} /></h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1">@{profile.username} <VerifiedBadge username={profile.username} /></p>
        {profile.bio && <p className="text-sm text-foreground mt-2">{profile.bio}</p>}
        {profile.status_text && <p className="text-xs text-muted-foreground mt-1">{profile.status_text}</p>}

        <div className="flex items-center gap-4 mt-3 text-sm">
          <span><strong className="text-foreground">{postCount}</strong> <span className="text-muted-foreground">Posts</span></span>
          <span><strong className="text-foreground">{followingCount}</strong> <span className="text-muted-foreground">Following</span></span>
          <span><strong className="text-foreground">{followerCount}</strong> <span className="text-muted-foreground">Followers</span></span>
          <span><strong className="text-foreground">{profile.profile_views}</strong> <span className="text-muted-foreground">Views</span></span>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {isOwn ? (
            <Button variant="outline" className="rounded-pill" onClick={() => navigate("/settings")}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="hero" className="rounded-pill" onClick={handleMessage}>
                <MessageCircle className="h-4 w-4 mr-1" /> Message
              </Button>
              <Button variant={isFollowing ? "outline" : "default"} className="rounded-pill" onClick={toggleFollow}>
                {isFollowing ? <><UserMinus className="h-4 w-4 mr-1" /> Unfollow</> : <><UserPlus className="h-4 w-4 mr-1" /> Follow</>}
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={shareProfile}>
            <Share className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === "posts" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === "info" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            About
          </button>
        </div>

        {/* Posts grid / list */}
        {activeTab === "posts" && (
          <div className="mt-4 space-y-4 pb-8">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No posts yet</p>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUserId={user?.id || ""} onUpdate={() => {}} />
              ))
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="mt-4 space-y-3 pb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Member since</p>
              <p className="text-sm text-foreground">{new Date(profile.created_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <Footer />

      {showBannerPicker && (
        <BannerPicker
          userId={profile.id}
          onClose={() => setShowBannerPicker(false)}
          onUpdate={(url) => { setProfile((p: any) => ({ ...p, banner_url: url })); refreshProfile(); }}
        />
      )}
    </div>
  );
};

export default UserProfile;
