import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus } from "lucide-react";
import { NewConversationDialog } from "./NewConversationDialog";

interface ConversationPreview {
  id: string;
  participant_ids: string[];
  last_message?: string;
  last_message_time?: string;
  other_participant?: any;
  is_group?: boolean;
}

export default function Inbox() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Fetch conversations and groups
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      setLoading(true);

      // Get conversations
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .contains("participant_ids", [profile.id])
        .order("last_message_time", { ascending: false });

      if (convs) {
        // Fetch other participant details
        const withOther = await Promise.all(
          convs.map(async (conv) => {
            const otherUserId = conv.participant_ids.find((id: string) => id !== profile.id);
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", otherUserId)
              .single();
            return { ...conv, other_participant: otherProfile, is_group: false };
          })
        );
        setConversations(withOther);
      }

      // Get groups
      const { data: grps } = await supabase
        .from("group_conversations")
        .select("*")
        .contains("member_ids", [profile.id])
        .order("created_at", { ascending: false });

      if (grps) setGroups(grps);

      setLoading(false);
    };

    fetchData();

    // Subscribe to conversation changes
    const subscription = supabase
      .channel("inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const allChats = [
    ...conversations.map((conv) => ({
      id: conv.id,
      name: conv.other_participant?.display_name || conv.other_participant?.username || "Unknown",
      lastMessage: conv.last_message,
      lastTime: conv.last_message_time,
      avatar: conv.other_participant?.avatar_url,
      isGroup: false,
    })),
    ...groups.map((grp) => ({
      id: grp.id,
      name: grp.name,
      lastMessage: grp.description,
      lastTime: grp.created_at,
      avatar: grp.avatar_url,
      isGroup: true,
    })),
  ].filter((chat) => chat.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <h2 className="text-lg font-bold mb-3">Messages</h2>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* New Conversation Button */}
        <button
          onClick={() => setShowNewConversation(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>

      {/* Conversations List with min-h-0 for proper scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : allChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No conversations yet. Start one!
          </div>
        ) : (
          allChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                if (chat.isGroup) {
                  navigate(`/app/group/${chat.id}`);
                } else {
                  navigate(`/app/${chat.id}`);
                }
              }}
              className="w-full px-3 py-2 border-b border-border hover:bg-muted transition-colors text-left flex items-start gap-2"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {chat.avatar ? (
                  <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary">{chat.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{chat.name}</div>
                <div className="text-xs text-muted-foreground truncate">{chat.lastMessage || "No messages"}</div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog open={showNewConversation} onOpenChange={setShowNewConversation} />
    </div>
  );
}
