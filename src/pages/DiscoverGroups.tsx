import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Globe, Lock, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AppSidebar from "@/components/chat/AppSidebar";
import Footer from "@/components/Footer";

interface PublicGroup {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  isMember?: boolean;
}

const DiscoverGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "members" | "alpha">("newest");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    const { data: publicGroups } = await supabase
      .from("groups")
      .select("id,name,description,avatar_url,is_public,created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!publicGroups) { setLoading(false); return; }

    // Get member counts
    const enriched = await Promise.all(
      publicGroups.map(async (g) => {
        const { count } = await supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", g.id);
        return { ...g, member_count: count ?? 0 };
      })
    );

    // Get user's memberships
    if (user) {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      const ids = new Set(memberships?.map(m => m.group_id) || []);
      setMyGroupIds(ids);
      setGroups(enriched.map(g => ({ ...g, isMember: ids.has(g.id) })));
    } else {
      setGroups(enriched);
    }

    setLoading(false);
  };

  const handleJoin = async (group: PublicGroup) => {
    if (!user) return;
    if (group.isMember) {
      navigate(`/app/group/${group.id}`);
      return;
    }

    setJoining(group.id);

    // Check if full
    if ((group.member_count ?? 0) >= 500) {
      toast({ title: "This group is full. Max 500 members reached 😅", variant: "destructive" });
      setJoining(null);
      return;
    }

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "member" });

    if (error) {
      if (error.message.includes("duplicate")) {
        navigate(`/app/group/${group.id}`);
      } else {
        toast({ title: "Could not join group. Try again.", variant: "destructive" });
      }
      setJoining(null);
      return;
    }

    // System message
    await supabase.from("group_messages").insert({
      group_id: group.id,
      sender_id: user.id,
      content: `joined the group 👋`,
      message_type: "system",
    });

    toast({ title: `You joined ${group.name}! 👋` });
    setMyGroupIds(prev => new Set([...prev, group.id]));
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, isMember: true, member_count: (g.member_count ?? 0) + 1 } : g));
    setJoining(null);
    navigate(`/app/group/${group.id}`);
  };

  const sorted = [...groups]
    .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "members") return (b.member_count ?? 0) - (a.member_count ?? 0);
      if (sort === "alpha") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="h-screen bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">🌐 Discover Groups</h1>
          <p className="text-sm text-muted-foreground mb-6">Find and join public groups</p>

          {/* Search & sort */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." className="pl-10 rounded-pill" />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="members">Most Members</option>
              <option value="alpha">A-Z</option>
            </select>
          </div>

          {loading ? (
            <div className="animate-breathe text-primary text-center py-16">Loading groups...</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">No public groups found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map(g => (
                <div key={g.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {g.avatar_url ? (
                      <img src={g.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      g.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                      <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                    </div>
                    {g.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{g.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" /> {g.member_count} members
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={g.isMember ? "outline" : "default"}
                    className="rounded-pill flex-shrink-0"
                    disabled={joining === g.id}
                    onClick={() => handleJoin(g)}
                  >
                    {joining === g.id ? "Joining..." : g.isMember ? "Open" : "Join"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"><AppSidebar mobile /></div>
    </div>
  );
};

export default DiscoverGroups;
