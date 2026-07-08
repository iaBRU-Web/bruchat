import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface Reaction {
  emoji: string;
  user_id: string;
  id: string;
}

interface EmojiReactionsProps {
  messageId: string;
  isGroupMessage?: boolean;
  reactions: Reaction[];
  onUpdate: () => void;
}

const EmojiReactions = ({ messageId, isGroupMessage, reactions, onUpdate }: EmojiReactionsProps) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);

  const grouped = reactions.reduce<Record<string, { count: number; userReacted: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userReacted: false };
    acc[r.emoji].count++;
    if (r.user_id === user?.id) acc[r.emoji].userReacted = true;
    return acc;
  }, {});

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").insert({
        [isGroupMessage ? "group_message_id" : "message_id"]: messageId,
        user_id: user.id,
        emoji,
      });
    }
    onUpdate();
    setShowPicker(false);
  };

  return (
    <div className="relative">
      {/* Existing reactions */}
      {Object.keys(grouped).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(grouped).map(([emoji, { count, userReacted }]) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              className={`text-xs px-1.5 py-0.5 rounded-pill border transition-colors ${
                userReacted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/50 text-foreground"
              }`}
            >
              {emoji} {count}
            </button>
          ))}
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="text-xs px-1.5 py-0.5 rounded-pill border border-border bg-muted/50 text-muted-foreground hover:text-foreground"
          >
            +
          </button>
        </div>
      )}

      {/* Quick picker */}
      {showPicker && (
        <div className="absolute bottom-full mb-1 left-0 bg-card border border-border rounded-xl shadow-lg px-2 py-1.5 flex gap-1 z-20">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              className="hover:scale-125 transition-transform text-lg p-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { EmojiReactions, QUICK_EMOJIS };
export type { Reaction };
