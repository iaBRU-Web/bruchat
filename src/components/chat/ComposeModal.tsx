import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CreateGroupModal from "./CreateGroupModal";

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
}

const ComposeModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [groupResults, setGroupResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setResults([]); setGroupResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const [userRes, groupRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url,is_online")
          .neq("id", user?.id)
          .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
          .limit(10),
        supabase
          .from("groups")
          .select("id,name,avatar_url,is_public")
          .eq("is_public", true)
          .ilike("name", `%${search}%`)
          .limit(5),
      ]);
      setResults(userRes.data || []);
      setGroupResults(groupRes.data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user]);

  const handleSelectUser = async (otherUser: UserResult) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_a.eq.${user.id},participant_b.eq.${otherUser.id}),and(participant_a.eq.${otherUser.id},participant_b.eq.${user.id})`)
      .single();

    if (existing) {
      navigate(`/app/${existing.id}`);
      onClose();
      return;
    }

    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ participant_a: user.id, participant_b: otherUser.id })
      .select("id")
      .single();

    if (newConvo) navigate(`/app/${newConvo.id}`);
    onClose();
  };

  if (showCreateGroup) {
    return <CreateGroupModal onClose={() => { setShowCreateGroup(false); onClose(); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-lg text-foreground">New message</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or name..."
              className="pl-10 rounded-pill"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Create Group</p>
              <p className="text-xs text-muted-foreground">Chat with up to 500 people</p>
            </div>
          </button>

          {loading && <div className="px-5 py-3 text-sm text-muted-foreground">Searching...</div>}

          {/* People results */}
          {results.length > 0 && (
            <div className="px-5 py-1"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">People</p></div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectUser(r)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="relative flex-shrink-0">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                    {r.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {r.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card bg-bruchat-online animate-pulse-online" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{r.display_name}</p>
                <p className="text-xs text-muted-foreground">@{r.username}</p>
              </div>
            </button>
          ))}

          {/* Public groups results */}
          {groupResults.length > 0 && (
            <>
              <div className="px-5 py-1"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Public Groups</p></div>
              {groupResults.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { navigate(`/app/group/${g.id}`); onClose(); }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                    {g.avatar_url ? <img src={g.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" /> : g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3 text-primary" />
                      <p className="text-sm font-medium text-foreground">{g.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Public group</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {search.length >= 2 && !loading && results.length === 0 && groupResults.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nothing matched that. Try different words 🔍
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
