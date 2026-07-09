import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { ConversationHeader } from "./ConversationHeader";
import { X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  media_url?: string;
  media_type?: string;
}

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: string;
  last_message_time?: string;
  created_at: string;
}

export function ConversationView({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation and messages
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      setLoading(true);

      // Get conversation
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (conv) {
        setConversation(conv);

        // Get other participant
        const otherUserId = conv.participant_ids.find((id: string) => id !== profile.id);
        if (otherUserId) {
          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", otherUserId)
            .single();
          setOther(otherProfile);
        }

        // Get messages
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (msgs) setMessages(msgs);
      }

      setLoading(false);
    };

    fetchData();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, profile]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!profile || !conversation) return;

    const { data } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
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
        <ConversationHeader other={other} onBack={onBack} />
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
