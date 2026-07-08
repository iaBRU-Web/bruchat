import VerifiedBadge from "@/components/VerifiedBadge";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Lock, Search, MoreVertical, Send, Paperclip, Smile, Mic, X, Trash2, Pencil, Copy, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MessageBubble from "./MessageBubble";
import ImageUpload from "./ImageUpload";
import EmojiPicker from "./EmojiPicker";
import AttachmentMenu from "./AttachmentMenu";
import { encryptMessage, decryptMessage, getPrivateKey, generateKeyPair, storePrivateKey, hasPrivateKey } from "@/lib/crypto";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string;
  audio_url: string;
  message_type: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_read: boolean;
  is_pinned: boolean;
  reply_to_id: string | null;
  created_at: string;
  encrypted: boolean;
  decryptedContent?: string;
}

interface OtherProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  away_status: string;
  last_seen: string;
  show_online_status: boolean;
  show_last_seen: boolean;
  public_key: string;
}

const ConversationView = ({ conversationId, onBack }: { conversationId: string; onBack: () => void }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<OtherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const rateLimitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize encryption
  useEffect(() => {
    const initCrypto = async () => {
      if (!user) return;
      const pk = await getPrivateKey(user.id);
      if (pk) {
        setPrivateKey(pk);
      } else {
        // Generate new key pair
        const { publicKeyPem, privateKey: newPk } = await generateKeyPair();
        await storePrivateKey(user.id, newPk);
        setPrivateKey(newPk);
        // Store public key in profile
        await supabase.from("profiles").update({ public_key: publicKeyPem }).eq("id", user.id);
      }
    };
    initCrypto();
  }, [user]);

  const decryptMessages = useCallback(async (msgs: any[]) => {
    return msgs.map(m => ({ ...m, decryptedContent: m.content }));
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data } = await (supabase
      .from("messages")
      .select("id,conversation_id,sender_id,content,sender_content,image_url,audio_url,message_type,is_edited,is_deleted,is_read,is_pinned,reply_to_id,created_at,encrypted") as any)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (data) {
      const decrypted = await decryptMessages(data as Message[]);
      setMessages(decrypted);
      if (user) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);
      }
    }
    setLoading(false);
  }, [conversationId, user, decryptMessages]);

  const fetchOtherUser = useCallback(async () => {
    const { data: convo } = await supabase
      .from("conversations")
      .select("participant_a,participant_b")
      .eq("id", conversationId)
      .single();

    if (convo && user) {
      const otherId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;
      const { data: p } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,is_online,away_status,last_seen,show_online_status,show_last_seen,public_key")
        .eq("id", otherId)
        .single();
      if (p) setOtherUser(p as OtherProfile);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        let newMsg = payload.new as any;
        newMsg.decryptedContent = newMsg.content;
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.sender_id !== user?.id) {
          supabase.from("messages").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", newMsg.id);
        }
        scrollToBottom();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => prev.map((m) => m.id === payload.new.id ? { ...m, ...payload.new, decryptedContent: m.decryptedContent } as Message : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, privateKey]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setRateLimitCount((c) => c + 1);
    if (rateLimitCount >= 10) {
      toast({ title: "Woah easy! 😅 Too fast — give it a sec.", variant: "destructive" });
      return;
    }
    if (!rateLimitTimer.current) {
      rateLimitTimer.current = setTimeout(() => {
        setRateLimitCount(0);
        rateLimitTimer.current = null;
      }, 10000);
    }

    const sanitized = newMessage.replace(/<[^>]*>/g, "").trim();
    if (!sanitized) return;

    setSending(true);

    if (editingMsg) {
      const fiveMin = 5 * 60 * 1000;
      if (Date.now() - new Date(editingMsg.created_at).getTime() > fiveMin) {
        toast({ title: "You can only edit within 5 minutes of sending 😅", variant: "destructive" });
        setEditingMsg(null);
        setSending(false);
        return;
      }
      await (supabase.from("messages") as any).update({
        content: sanitized,
        sender_content: "",
        is_edited: true,
        edited_at: new Date().toISOString(),
      }).eq("id", editingMsg.id);
      setEditingMsg(null);
      setNewMessage("");
      setSending(false);
      fetchMessages();
      return;
    }

    const { error } = await (supabase.from("messages") as any).insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: sanitized,
      sender_content: "",
      message_type: "text",
      reply_to_id: replyTo?.id || null,
      encrypted: false,
    });

    if (!error) {
      setNewMessage("");
      setReplyTo(null);
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }
    setSending(false);
  };

  const handleImageSend = async (imageUrl: string) => {
    if (!user) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      image_url: imageUrl,
      message_type: "image",
      content: "📷 Image",
      encrypted: false,
    });
    await supabase.from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
    setShowImageUpload(false);
  };

  const handleFileSend = async (msg: any) => {
    if (!user) return;
    await (supabase.from("messages") as any).insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: msg.content,
      message_type: msg.message_type,
      image_url: msg.image_url || "",
      audio_url: msg.audio_url || "",
      video_url: msg.video_url || "",
      file_url: msg.file_url || "",
      file_name: msg.file_name || "",
      file_size: msg.file_size || 0,
      file_type: msg.file_type || "",
      encrypted: false,
    });
    await supabase.from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  };

  const handleDelete = async (msgId: string) => {
    await supabase.from("messages").update({ is_deleted: true, content: "" }).eq("id", msgId);
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, is_deleted: true } : m));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied! 📋" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusText = () => {
    if (!otherUser) return "";
    if (!otherUser.show_online_status) return "";
    if (otherUser.is_online) {
      if (otherUser.away_status === "away") return "Away";
      if (otherUser.away_status === "busy") return "Busy";
      return "Online";
    }
    if (!otherUser.show_last_seen) return "Offline";
    const d = new Date(otherUser.last_seen);
    return `Last seen ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const statusColor = () => {
    if (!otherUser?.is_online) return "text-muted-foreground";
    if (otherUser.away_status === "away") return "text-yellow-500";
    if (otherUser.away_status === "busy") return "text-destructive";
    return "text-bruchat-online";
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => (m.decryptedContent || m.content || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Date separators
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="md:hidden text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {otherUser && (
          <>
            <div className="relative">
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {otherUser.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              {otherUser.is_online && otherUser.show_online_status && (
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                  otherUser.away_status === "away" ? "bg-yellow-500" :
                  otherUser.away_status === "busy" ? "bg-destructive" : "bg-bruchat-online animate-pulse-online"
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">{otherUser.display_name} <VerifiedBadge username={otherUser.username} /></p>
              <p className={`text-xs ${statusColor()}`}>{statusText()}</p>
            </div>
          </>
        )}
        <div className="flex items-center gap-1 px-2 py-1 rounded-pill bg-bruchat-online/10" title="This conversation is end-to-end encrypted. Only you and this person can read these messages.">
          <Lock className="h-3 w-3 text-bruchat-online" />
          <span className="text-[10px] text-bruchat-online font-medium hidden sm:inline">Encrypted</span>
        </div>
        <button onClick={() => setSearchOpen(!searchOpen)} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors">
          <Search className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 py-2 bg-card border-b border-border flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in conversation..."
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-breathe text-primary text-sm font-heading">Loading messages...</div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Lock className="h-12 w-12 text-bruchat-online/30 mb-4" />
            <p className="text-base font-medium mb-1">Messages are end-to-end encrypted</p>
            <p className="text-sm">No one outside of this chat can read them. Say hi! 👋</p>
          </div>
        ) : (
          filteredMessages.map((msg, i) => {
            const isOwn = msg.sender_id === user?.id;
            const showAvatar = !isOwn && (i === 0 || filteredMessages[i - 1]?.sender_id !== msg.sender_id);
            const prevDate = i > 0 ? new Date(filteredMessages[i - 1].created_at).toDateString() : "";
            const currDate = new Date(msg.created_at).toDateString();
            const showDateSep = i === 0 || prevDate !== currDate;

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-pill">
                      {getDateLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={{ ...msg, content: msg.decryptedContent || msg.content }}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  otherAvatar={otherUser?.avatar_url || ""}
                  otherName={otherUser?.display_name || ""}
                  onReply={() => setReplyTo(msg)}
                  onEdit={() => {
                    setEditingMsg(msg);
                    setNewMessage(msg.decryptedContent || msg.content);
                    inputRef.current?.focus();
                  }}
                  onDelete={() => handleDelete(msg.id)}
                  onCopy={() => handleCopy(msg.decryptedContent || msg.content)}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply / Edit strip */}
      {(replyTo || editingMsg) && (
        <div className="px-4 md:px-6 py-2 bg-muted/50 border-t border-border flex items-center gap-2">
          <div className="w-1 h-8 rounded-full bg-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-primary font-medium">{editingMsg ? "Editing message" : "Replying to"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {editingMsg
                ? (editingMsg.decryptedContent || editingMsg.content)?.slice(0, 60)
                : replyTo?.is_deleted ? "Deleted message" : (replyTo?.decryptedContent || replyTo?.content)?.slice(0, 60)
              }
            </p>
          </div>
          <button onClick={() => { setReplyTo(null); setEditingMsg(null); setNewMessage(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 md:px-6 py-3 border-t border-border bg-card relative pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={(emoji) => setNewMessage(prev => prev + emoji)}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
        {showAttachMenu && (
          <AttachmentMenu
            onClose={() => setShowAttachMenu(false)}
            onFileSent={handleFileSend}
          />
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
            className={`text-muted-foreground hover:text-foreground p-2 transition-colors ${showAttachMenu ? 'text-primary' : ''}`}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
            className={`text-muted-foreground hover:text-foreground p-2 transition-colors ${showEmojiPicker ? 'text-primary' : ''}`}
          >
            <Smile className="h-4 w-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser?.display_name || ""}...`}
              className="w-full resize-none rounded-2xl bg-muted border-0 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
              rows={1}
              maxLength={1000}
            />
            {newMessage.length > 800 && (
              <span className="absolute right-3 bottom-2 text-[10px] text-muted-foreground">{newMessage.length}/1000</span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-bruchat-online/5" title="End-to-end encrypted">
              <Lock className="h-2.5 w-2.5 text-bruchat-online" />
            </div>
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                newMessage.trim()
                  ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--bruchat-accent-glow)/0.5)] hover:shadow-[0_0_24px_hsl(var(--bruchat-accent-glow)/0.7)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationView;
