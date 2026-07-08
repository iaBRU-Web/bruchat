import { useState, useEffect } from "react";
import { Award, Users, Heart, MessageCircle, FileText, Trophy, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import AppSidebar from "@/components/chat/AppSidebar";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [
  { type: "followers_10", label: "10 Followers", icon: Users, threshold: 10, category: "followers", color: "text-blue-400" },
  { type: "followers_20", label: "20 Followers", icon: Users, threshold: 20, category: "followers", color: "text-blue-500" },
  { type: "followers_30", label: "30 Followers", icon: Users, threshold: 30, category: "followers", color: "text-blue-600" },
  { type: "followers_40", label: "40 Followers", icon: Users, threshold: 40, category: "followers", color: "text-indigo-500" },
  { type: "followers_50", label: "50 Followers", icon: Users, threshold: 50, category: "followers", color: "text-indigo-600" },
  { type: "followers_100", label: "100 Followers", icon: Users, threshold: 100, category: "followers", color: "text-purple-500" },
  { type: "posts_5", label: "5 Posts", icon: FileText, threshold: 5, category: "posts", color: "text-green-400" },
  { type: "posts_10", label: "10 Posts", icon: FileText, threshold: 10, category: "posts", color: "text-green-500" },
  { type: "posts_25", label: "25 Posts", icon: FileText, threshold: 25, category: "posts", color: "text-green-600" },
  { type: "posts_50", label: "50 Posts", icon: FileText, threshold: 50, category: "posts", color: "text-emerald-500" },
  { type: "likes_10", label: "10 Likes Received", icon: Heart, threshold: 10, category: "likes", color: "text-red-400" },
  { type: "likes_50", label: "50 Likes Received", icon: Heart, threshold: 50, category: "likes", color: "text-red-500" },
  { type: "likes_100", label: "100 Likes Received", icon: Heart, threshold: 100, category: "likes", color: "text-red-600" },
  { type: "comments_10", label: "10 Comments", icon: MessageCircle, threshold: 10, category: "comments", color: "text-yellow-400" },
  { type: "comments_50", label: "50 Comments", icon: MessageCircle, threshold: 50, category: "comments", color: "text-yellow-500" },
  { type: "comments_100", label: "100 Comments", icon: MessageCircle, threshold: 100, category: "comments", color: "text-yellow-600" },
];

const Achievements = () => {
  const { user } = useAuth();
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ followers: 0, posts: 0, likes: 0, comments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: achievements }, { count: followers }, { count: posts }, { count: comments }] = await Promise.all([
        supabase.from("achievements").select("achievement_type").eq("user_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      // Get total likes received on user's posts
      const { data: userPosts } = await supabase.from("posts").select("likes_count").eq("user_id", user.id);
      const totalLikes = (userPosts || []).reduce((sum, p) => sum + (p.likes_count || 0), 0);

      const currentStats = { followers: followers ?? 0, posts: posts ?? 0, likes: totalLikes, comments: comments ?? 0 };
      setStats(currentStats);
      setEarned(new Set((achievements || []).map(a => a.achievement_type)));

      // Auto-claim new achievements
      const existingSet = new Set((achievements || []).map(a => a.achievement_type));
      const toClaim: string[] = [];
      for (const m of MILESTONES) {
        if (existingSet.has(m.type)) continue;
        const val = currentStats[m.category as keyof typeof currentStats];
        if (val >= m.threshold) toClaim.push(m.type);
      }
      if (toClaim.length > 0) {
        for (const t of toClaim) {
          await supabase.functions.invoke("admin-operations", {
            body: { action: "grant-achievement", payload: { user_id: user.id, achievement_type: t } },
          });
        }
        setEarned(prev => { const n = new Set(prev); toClaim.forEach(t => n.add(t)); return n; });
        toast({ title: `🏆 You earned ${toClaim.length} new certificate${toClaim.length > 1 ? "s" : ""}!` });
      }

      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Certificates & Achievements</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Earn certificates by reaching milestones. {earned.size}/{MILESTONES.length} earned.
            </p>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: "Followers", value: stats.followers, icon: Users },
              { label: "Posts", value: stats.posts, icon: FileText },
              { label: "Likes", value: stats.likes, icon: Heart },
              { label: "Comments", value: stats.comments, icon: MessageCircle },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <s.icon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MILESTONES.map(m => {
                const isEarned = earned.has(m.type);
                const currentVal = stats[m.category as keyof typeof stats];
                const progress = Math.min(100, (currentVal / m.threshold) * 100);
                return (
                  <div key={m.type} className={`relative bg-card border rounded-2xl p-4 transition-all ${isEarned ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border opacity-70"}`}>
                    {isEarned && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Award className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEarned ? "bg-primary/10" : "bg-muted/50"}`}>
                        {isEarned ? <m.icon className={`h-5 w-5 ${m.color}`} /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                        <p className="text-[10px] text-muted-foreground">{isEarned ? "🏆 Earned!" : `${currentVal}/${m.threshold}`}</p>
                      </div>
                    </div>
                    {!isEarned && (
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Footer />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AppSidebar mobile />
      </div>
    </div>
  );
};

export default Achievements;
