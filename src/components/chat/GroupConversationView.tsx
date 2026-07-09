import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { GroupConversationHeader } from "./GroupConversationHeader";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  media_url?: string;
  media_type?: string;
}

interface GroupConversation {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  member_ids: string[];
  created_at: string;
  created_by: string;
}

export function GroupConversationView({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<GroupConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch group and messages
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      setLoading(true);

      // Get group
      const { data: grp } = await supabase
        .from("group_conversations")
        .select("*")
        .eq("id", groupId)
        .single();

      if (grp) {
        setGroup(grp);

        // Get messages
        const { data: msgs } = await supabase
          .from("group_messages")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true });

        if (msgs) setMessages(msgs);
      }

      setLoading(false);
    };

    fetchData();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`group-messages:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId, profile]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!profile || !group) return;

    const { data } = await supabase
      .from("group_messages")
      .insert([
        {
          group_id: groupId,
          sender_id: profile.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
        },
      ])
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data]);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <GroupConversationHeader group={group} onBack={onBack} />
      </div>

      {/* Messages Container with min-h-0 for proper scroll */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
        <MessageList messages={messages} currentUserId={profile?.id} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t border-border">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
