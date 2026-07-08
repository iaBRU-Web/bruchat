import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, PenSquare, X, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { decryptMessage, getPrivateKey } from "@/lib/crypto";
import ComposeModal from "./ComposeModal";

interface ConversationRow {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  is_muted_a: boolean;
  is_muted_b: boolean;
  is_archived_a: boolean;
  is_archived_b: boolean;
  is_pinned_a: boolean;
  is_pinned_b: boolean;
  other_profile?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_online: boolean;
    away_status: string;
  };
  last_message?: string;
  unread_count?: number;
}

interface GroupRow {
  id: string;
  name: string;
  avatar_url: string;
  last_message_at?: string;
  member_count?: number;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return date.toLocaleDateString("en", { weekday: "short" });
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
};

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId, groupId } = useParams();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "unread" | "archived">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

  // Load private key once
  useEffect(() => {
    if (!user) return;
    getPrivateKey(user.id).then(pk => { if (pk) setPrivateKey(pk); });
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Fetch only 20 conversations max
      const { data: convos } = await supabase
        .from("conversations")
        .select("id,participant_a,participant_b,last_message_at,is_muted_a,is_muted_b,is_archived_a,is_archived_b,is_pinned_a,is_pinned_b")
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false })
        .limit(20);

      if (!convos) { setLoading(false); fetchingRef.current = false; return; }

      // Batch fetch other profiles
      const otherIds = convos.map(c => c.participant_a === user.id ? c.participant_b : c.participant_a);
      const uniqueIds = [...new Set(otherIds)];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,is_online,away_status")
        .in("id", uniqueIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Batch fetch last messages - one query per conversation is unavoidable but we can parallelize
      const convoIds = convos.map(c => c.id);
      
      // Get unread counts in a single query approach
      const enriched: ConversationRow[] = convos.map(c => {
        const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        return {
          ...c,
          other_profile: profileMap.get(otherId) || undefined,
          last_message: "...",
          unread_count: 0,
        };
      });

      // Set conversations immediately with profiles so UI renders fast
      setConversations(enriched);
      setLoading(false);

      // Then fetch last messages and unread counts in background
      const enrichedWithMessages = await Promise.all(
        enriched.map(async (c) => {
          const [lastMsgResult, unreadResult] = await Promise.all([
            (supabase
              .from("messages")
              .select("content,sender_content,sender_id,is_deleted,message_type,encrypted") as any)
              .eq("conversation_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", c.id)
              .eq("is_read", false)
              .neq("sender_id", user.id),
          ]);

          let preview = "No messages yet";
          const lastMsg = lastMsgResult.data;
          if (lastMsg) {
            if (lastMsg.is_deleted) preview = "This message was deleted.";
            else if (lastMsg.message_type === "image") preview = "📷 Photo";
            else if (lastMsg.message_type === "voice") preview = "🎤 Voice message";
            else if (lastMsg.message_type === "file") preview = "📎 File";
            else if (lastMsg.message_type === "video") preview = "🎬 Video";
            else if (lastMsg.encrypted && lastMsg.content && privateKey) {
              try {
                const textToDecrypt = lastMsg.sender_id === user.id
                  ? (lastMsg.sender_content || lastMsg.content)
                  : lastMsg.content;
                const decrypted = await decryptMessage(textToDecrypt, privateKey);
                preview = decrypted.length > 35 ? decrypted.slice(0, 35) + "…" : decrypted;
              } catch {
                preview = "🔒 New message";
              }
            } else if (lastMsg.content) {
              preview = lastMsg.content.length > 35 ? lastMsg.content.slice(0, 35) + "…" : lastMsg.content;
            }
          }

          return { ...c, last_message: preview, unread_count: unreadResult.count ?? 0 };
        })
      );

      setConversations(enrichedWithMessages);

      // Fetch groups
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberRows && memberRows.length > 0) {
        const groupIds = memberRows.map((r) => r.group_id);
        const { data: groupData } = await supabase
          .from("groups")
          .select("id,name,avatar_url")
          .in("id", groupIds);
        setGroups(groupData || []);
      }
    } catch {
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel("inbox-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => { fetchConversations(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => { fetchConversations(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (tab === "unread") list = list.filter((c) => (c.unread_count ?? 0) > 0);
    if (tab === "archived") {
      list = list.filter((c) =>
        (c.participant_a === user?.id && c.is_archived_a) ||
        (c.participant_b === user?.id && c.is_archived_b)
      );
    } else {
      list = list.filter((c) =>
        !(c.participant_a === user?.id && c.is_archived_a) &&
        !(c.participant_b === user?.id && c.is_archived_b)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.other_profile?.display_name?.toLowerCase().includes(q) ||
        c.other_profile?.username?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const aPinned = (a.participant_a === user?.id && a.is_pinned_a) || (a.participant_b === user?.id && a.is_pinned_b);
      const bPinned = (b.participant_a === user?.id && b.is_pinned_a) || (b.participant_b === user?.id && b.is_pinned_b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [conversations, tab, search, user]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  }, [groups, search]);

  const statusDotColor = (status: string, online: boolean) => {
    if (!online) return "bg-muted-foreground";
    if (status === "away") return "bg-yellow-500";
    if (status === "busy") return "bg-destructive";
    return "bg-bruchat-online";
  };

  return (
    <>
      <div className="h-full flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl text-foreground">Messages</h2>
          <button
            onClick={() => setShowCompose(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <PenSquare className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-2 gap-1">
          {(["all", "unread", "archived"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-pill text-xs font-semibold transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 h-9 text-sm rounded-pill bg-muted border-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-safe-nav">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 bg-muted rounded" />
                    <div className="h-2.5 w-40 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 && filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-4xl mb-3">👋</p>
              <p className="text-muted-foreground text-sm font-medium">No chats yet. Say hi to someone!</p>
            </div>
          ) : (
            <>
              {filteredConversations.map((c) => {
                const isActive = conversationId === c.id;
                const p = c.other_profile;
                const isMuted = (c.participant_a === user?.id && c.is_muted_a) || (c.participant_b === user?.id && c.is_muted_b);
                const isPinned = (c.participant_a === user?.id && c.is_pinned_a) || (c.participant_b === user?.id && c.is_pinned_b);

                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/app/${c.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted/50 ${
                      isActive ? "bg-primary/5 border-r-2 border-primary" : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base font-bold">
                          {p?.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                        statusDotColor(p?.away_status || "online", p?.is_online || false)
                      } ${p?.is_online ? "animate-pulse-online" : ""}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {p?.display_name || "Unknown"}
                          {isMuted && <span className="ml-1.5 text-muted-foreground text-xs">🔇</span>}
                          {isPinned && <Pin className="inline h-3 w-3 ml-1 text-primary" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatTime(c.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                        {(c.unread_count ?? 0) > 0 && (
                          <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredGroups.map((g) => {
                const isActive = groupId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/app/group/${g.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted/50 ${
                      isActive ? "bg-primary/5 border-r-2 border-primary" : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base font-bold flex-shrink-0">
                      {g.avatar_url ? (
                        <img src={g.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        g.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate block">{g.name}</span>
                      <p className="text-xs text-muted-foreground truncate">Group chat</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
    </>
  );
};

export default Inbox;
