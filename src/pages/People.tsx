import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/chat/AppSidebar";
import Footer from "@/components/Footer";
import VerifiedBadge from "@/components/VerifiedBadge";

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  away_status: string;
  is_following?: boolean;
}

const People = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [suggested, setSuggested] = useState<UserRow[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get blocked users
      const { data: blocks } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);
      const blockedIds = blocks?.map((b) => b.blocked_id) || [];

      // Get following
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followSet = new Set(follows?.map((f) => f.following_id) || []);
      setFollowing(followSet);

      // Get all users
      let query = supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,is_online,away_status")
        .neq("id", user.id)
        .limit(50);

      if (blockedIds.length > 0) {
        // Filter out blocked users manually after fetch
      }

      const { data: allUsers } = await query;
      const filtered = (allUsers || []).filter((u) => !blockedIds.includes(u.id));
      setUsers(filtered as UserRow[]);

      // People you may know: followed by people you follow but you don't follow
      if (followSet.size > 0) {
        const followIds = Array.from(followSet);
        const { data: fof } = await supabase
          .from("follows")
          .select("following_id")
          .in("follower_id", followIds)
          .not("following_id", "in", `(${[user.id, ...followIds].join(",")})`)
          .limit(5);

        if (fof && fof.length > 0) {
          const suggestedIds = [...new Set(fof.map((f) => f.following_id))].slice(0, 5);
          const { data: suggestedProfiles } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url,is_online,away_status")
            .in("id", suggestedIds);
          setSuggested((suggestedProfiles || []) as UserRow[]);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const toggleFollow = async (userId: string) => {
    if (!user) return;
    if (following.has(userId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      setFollowing((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
      setFollowing((prev) => new Set([...prev, userId]));
    }
  };

  const filteredUsers = search
    ? users.filter((u) => u.display_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
    : users;

  const statusDot = (status: string, online: boolean) => {
    if (!online) return "bg-muted-foreground";
    if (status === "away") return "bg-yellow-500";
    if (status === "busy") return "bg-destructive";
    return "bg-bruchat-online";
  };

  return (
    <div className="h-[100dvh] bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pb-safe-nav">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">People</h1>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="pl-10 rounded-pill"
            />
          </div>

          {/* Suggested */}
          {suggested.length > 0 && !search && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">People you may know</h3>
              <div className="space-y-2">
                {suggested.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <button onClick={() => navigate(`/user/${u.username}`)} className="relative flex-shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {u.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${statusDot(u.away_status, u.is_online)}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">{u.display_name} <VerifiedBadge username={u.username} /></p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={following.has(u.id) ? "outline" : "default"}
                      className="rounded-pill text-xs"
                      onClick={() => toggleFollow(u.id)}
                    >
                      {following.has(u.id) ? <><UserMinus className="h-3 w-3 mr-1" /> Unfollow</> : <><UserPlus className="h-3 w-3 mr-1" /> Follow</>}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All users */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nothing matched that. Try different words 🔍</p>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <button onClick={() => navigate(`/user/${u.username}`)} className="relative flex-shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {u.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusDot(u.away_status, u.is_online)}`} />
                  </button>
                  <button onClick={() => navigate(`/user/${u.username}`)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">{u.display_name} <VerifiedBadge username={u.username} /></p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </button>
                  <Button
                    size="sm"
                    variant={following.has(u.id) ? "outline" : "default"}
                    className="rounded-pill text-xs"
                    onClick={() => toggleFollow(u.id)}
                  >
                    {following.has(u.id) ? "Unfollow" : "Follow"}
                  </Button>
                </div>
              ))}
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

export default People;
