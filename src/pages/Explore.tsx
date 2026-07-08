import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AppSidebar from "@/components/chat/AppSidebar";
import Footer from "@/components/Footer";
import PostCard from "@/components/posts/PostCard";

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchExploreData();
  }, [user]);

  const fetchExploreData = async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { data: trending } = await supabase
      .from("posts")
      .select("*")
      .eq("is_public", true)
      .gte("created_at", yesterday)
      .order("likes_count", { ascending: false })
      .limit(10);

    if (trending && trending.length > 0) {
      const userIds = [...new Set(trending.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds);
      const pMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let likedSet = new Set<string>();
      let savedSet = new Set<string>();
      if (user) {
        const postIds = trending.map(p => p.id);
        const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds);
        likedSet = new Set(likes?.map(l => l.post_id) || []);
        const { data: saves } = await supabase.from("post_saves").select("post_id").eq("user_id", user.id).in("post_id", postIds);
        savedSet = new Set(saves?.map(s => s.post_id) || []);
      }

      setTrendingPosts(trending.map(p => ({ ...p, profile: pMap.get(p.user_id), isLiked: likedSet.has(p.id), isSaved: savedSet.has(p.id) })));
    }

    let followSet = new Set<string>();
    if (user) {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      followSet = new Set(follows?.map(f => f.following_id) || []);
      setFollowing(followSet);

      const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
      setMyGroupIds(new Set(memberships?.map(m => m.group_id) || []));
    }

    const { data: allUsers } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,is_online")
      .neq("id", user?.id || "")
      .limit(20);

    const suggested = (allUsers || []).filter(u => !followSet.has(u.id)).slice(0, 8);
    setSuggestedUsers(suggested);

    const { data: groups } = await supabase
      .from("groups")
      .select("id,name,avatar_url,description")
      .eq("is_public", true)
      .limit(5);

    if (groups) {
      const enriched = await Promise.all(groups.map(async g => {
        const { count } = await supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", g.id);
        return { ...g, member_count: count ?? 0 };
      }));
      setActiveGroups(enriched);
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recent } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .gte("created_at", weekAgo)
      .neq("id", user?.id || "")
      .limit(5);
    setNewUsers(recent || []);

    setLoading(false);
  };

  const toggleFollow = async (userId: string) => {
    if (!user) return;
    if (following.has(userId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      setFollowing(prev => { const n = new Set(prev); n.delete(userId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
      setFollowing(prev => new Set([...prev, userId]));
      await supabase.from("notifications").insert({ user_id: userId, type: "follow", from_user_id: user.id });
    }
  };

  const joinGroup = async (group: any) => {
    if (!user) return;
    if (myGroupIds.has(group.id)) {
      navigate(`/app/group/${group.id}`);
      return;
    }
    setJoining(group.id);
    if ((group.member_count ?? 0) >= 500) {
      toast({ title: "This group is full. Max 500 members reached 😅", variant: "destructive" });
      setJoining(null);
      return;
    }
    const { error } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id, role: "member" });
    if (error) {
      if (error.message.includes("duplicate")) navigate(`/app/group/${group.id}`);
      else toast({ title: "Could not join group", variant: "destructive" });
      setJoining(null);
      return;
    }
    await supabase.from("group_messages").insert({ group_id: group.id, sender_id: user.id, content: "joined the group 👋", message_type: "system" });
    toast({ title: `You joined ${group.name}! 👋` });
    setMyGroupIds(prev => new Set([...prev, group.id]));
    setJoining(null);
    navigate(`/app/group/${group.id}`);
  };

  return (
    <div className="h-screen bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">🧭 Explore</h1>
            <Button variant="outline" size="sm" className="rounded-pill" onClick={() => navigate("/discover-groups")}>
              <Globe className="h-3.5 w-3.5 mr-1.5" /> Discover Groups
            </Button>
          </div>

          {loading ? (
            <div className="animate-breathe text-primary text-center py-16">Loading...</div>
          ) : (
            <div className="space-y-8">
              {trendingPosts.length > 0 && (
                <section>
                  <h2 className="font-heading text-lg font-semibold text-foreground mb-3">🔥 Trending Posts</h2>
                  <div className="space-y-4">
                    {trendingPosts.map(post => (
                      <PostCard key={post.id} post={post} currentUserId={user?.id || ""} onUpdate={fetchExploreData} />
                    ))}
                  </div>
                </section>
              )}

              {suggestedUsers.length > 0 && (
                <section>
                  <h2 className="font-heading text-lg font-semibold text-foreground mb-3">People to Follow</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedUsers.map(u => (
                      <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2">
                        <button onClick={() => navigate(`/user/${u.username}`)}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {u.display_name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </button>
                        <p className="text-sm font-medium text-foreground truncate max-w-full">{u.display_name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                        <Button
                          size="sm"
                          variant={following.has(u.id) ? "outline" : "default"}
                          className="rounded-pill text-xs w-full"
                          onClick={() => toggleFollow(u.id)}
                        >
                          {following.has(u.id) ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeGroups.length > 0 && (
                <section>
                  <h2 className="font-heading text-lg font-semibold text-foreground mb-3">🌐 Public Groups</h2>
                  <div className="space-y-2">
                    {activeGroups.map(g => (
                      <div key={g.id} className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {g.avatar_url ? <img src={g.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : g.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                            <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                          </div>
                          {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                          <p className="text-[11px] text-muted-foreground">{g.member_count} members</p>
                        </div>
                        <Button
                          size="sm"
                          variant={myGroupIds.has(g.id) ? "outline" : "default"}
                          className="rounded-pill flex-shrink-0"
                          disabled={joining === g.id}
                          onClick={() => joinGroup(g)}
                        >
                          {joining === g.id ? "..." : myGroupIds.has(g.id) ? "Open" : "Join"}
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => navigate("/discover-groups")}>
                      View all groups →
                    </Button>
                  </div>
                </section>
              )}

              {newUsers.length > 0 && (
                <section>
                  <h2 className="font-heading text-lg font-semibold text-foreground mb-3">New to BRUChat</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {newUsers.map(u => (
                      <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 min-w-[120px]">
                        <button onClick={() => navigate(`/user/${u.username}`)}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {u.display_name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </button>
                        <p className="text-xs font-medium text-foreground truncate max-w-full">{u.display_name}</p>
                        <Button size="sm" variant={following.has(u.id) ? "outline" : "default"} className="rounded-pill text-[10px] w-full" onClick={() => toggleFollow(u.id)}>
                          {following.has(u.id) ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"><AppSidebar mobile /></div>
    </div>
  );
};

export default Explore;
