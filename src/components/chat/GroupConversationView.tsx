import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Search, MoreVertical, Send, Smile, Users, X, Shield, Crown, LogOut, UserPlus, Link2, Lock, Trash2, Globe, Paperclip, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "./ImageUpload";
import AttachmentMenu from "./AttachmentMenu";
import AddMembersModal from "@/components/group/AddMembersModal";
import VoiceRecorder from "./VoiceRecorder";

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  image_url: string;
  audio_url?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  message_type: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface GroupInfo {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  member_count?: number;
  invite_link?: string;
  created_by: string;
  is_public?: boolean;
  slow_mode_duration?: number;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile?: { display_name: string; avatar_url: string; username: string; is_online: boolean; away_status: string };
}

const GroupConversationView = ({ groupId, onBack }: { groupId: string; onBack: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { display_name: string; avatar_url: string }>>({});
  const memberProfilesRef = useRef<Record<string, { display_name: string; avatar_url: string }>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [slowCooldown, setSlowCooldown] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      const { data: g } = await supabase
        .from("groups")
        .select("id,name,avatar_url,description,invite_link,created_by,is_public,slow_mode_duration")
        .eq("id", groupId)
        .single();
      if (g) {
        const { count } = await supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId);
        setGroup({ ...g, member_count: count ?? 0 } as GroupInfo);
      }

      if (user) {
        const { data: membership } = await supabase
          .from("group_members")
          .select("role")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .single();
        setIsAdmin(membership?.role === "admin");
      }
    };

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("id,group_id,sender_id,content,image_url,audio_url,video_url,file_url,file_name,file_size,file_type,message_type,is_edited,is_deleted,created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (data) {
        const senderIds = [...new Set(data.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .in("id", senderIds);

        const profileMap: Record<string, { display_name: string; avatar_url: string }> = {};
        profiles?.forEach((p) => { profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url || "" }; });
        setMemberProfiles(profileMap);
        memberProfilesRef.current = profileMap;

        setMessages(data.map((m) => ({
          ...m,
          image_url: m.image_url || "",
          sender_name: profileMap[m.sender_id]?.display_name || "Unknown",
          sender_avatar: profileMap[m.sender_id]?.avatar_url || "",
        })) as GroupMessage[]);
      }
      setLoading(false);
    };

    fetchGroup();
    fetchMessages();

    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${groupId}`,
      }, async (payload) => {
        const newMsg = payload.new as GroupMessage;
        const cached = memberProfilesRef.current[newMsg.sender_id];
        if (!cached) {
          const { data: p } = await supabase.from("profiles").select("id,display_name,avatar_url").eq("id", newMsg.sender_id).single();
          if (p) {
            const entry = { display_name: p.display_name, avatar_url: p.avatar_url || "" };
            memberProfilesRef.current = { ...memberProfilesRef.current, [p.id]: entry };
            setMemberProfiles(prev => ({ ...prev, [p.id]: entry }));
            newMsg.sender_name = p.display_name;
            newMsg.sender_avatar = p.avatar_url || "";
          }
        } else {
          newMsg.sender_name = cached.display_name;
          newMsg.sender_avatar = cached.avatar_url;
        }
        setMessages((prev) => [...prev, { ...newMsg, image_url: newMsg.image_url || "" }]);
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const fetchMembers = async () => {
    const { data: memberRows } = await supabase
      .from("group_members")
      .select("id,user_id,role")
      .eq("group_id", groupId);

    if (memberRows) {
      const userIds = memberRows.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,username,is_online,away_status")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.id] = p; });

      setMembers(memberRows.map(m => ({
        ...m,
        profile: profileMap[m.user_id],
      })));
    }
  };

  useEffect(() => {
    if (showInfo) fetchMembers();
  }, [showInfo]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    // Slow mode check
    if (slowCooldown > 0 && !isAdmin) {
      toast({ title: `Slow mode is on. Wait ${slowCooldown}s between messages 🐌`, variant: "destructive" });
      return;
    }

    const sanitized = newMessage.replace(/<[^>]*>/g, "").trim();
    if (!sanitized) return;

    setSending(true);
    await supabase.from("group_messages").insert({
      group_id: groupId,
      sender_id: user.id,
      content: sanitized,
      message_type: "text",
    });
    setNewMessage("");
    setSending(false);

    // Start slow mode cooldown
    if (group?.slow_mode_duration && group.slow_mode_duration > 0 && !isAdmin) {
      setSlowCooldown(group.slow_mode_duration);
    }
  };

  // Slow mode countdown
  useEffect(() => {
    if (slowCooldown <= 0) return;
    const timer = setInterval(() => {
      setSlowCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [slowCooldown]);

  const handleImageSend = async (imageUrl: string) => {
    if (!user) return;
    await supabase.from("group_messages").insert({
      group_id: groupId,
      sender_id: user.id,
      image_url: imageUrl,
      message_type: "image",
      content: "📷 Image",
    });
  };

  const handleFileSend = async (msg: { content: string; message_type: string; image_url?: string; audio_url?: string; video_url?: string; file_url?: string; file_name?: string; file_size?: number; file_type?: string }) => {
    if (!user) return;
    await supabase.from("group_messages").insert({
      group_id: groupId,
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
    });
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const leaveGroup = async () => {
    if (!user) return;
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    await supabase.from("group_messages").insert({ group_id: groupId, sender_id: user.id, content: "left the group", message_type: "system" });
    onBack();
    toast({ title: `You left ${group?.name || "the group"}. You can rejoin anytime.` });
    setShowLeaveConfirm(false);
  };

  const copyInviteLink = () => {
    if (group?.invite_link) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_link}`);
      toast({ title: "Invite link copied! 🔗" });
    }
  };

  const removeMember = async (memberId: string, memberUsername: string) => {
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberId);
    await supabase.from("notifications").insert({ user_id: memberId, type: "group_removed", from_user_id: user?.id, group_id: groupId });
    await supabase.from("group_messages").insert({
      group_id: groupId,
      sender_id: user?.id || "",
      content: `${memberUsername} was removed from the group`,
      message_type: "system",
    });
    toast({ title: `${memberUsername} was removed from the group` });
    fetchMembers();
    if (group) setGroup({ ...group, member_count: (group.member_count || 1) - 1 });
  };

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
        {group && (
          <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
              {group.avatar_url ? (
                <img src={group.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                group.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground truncate">{group.name}</p>
                {group.is_public ? (
                  <span title="Public group"><Globe className="h-3 w-3 text-primary flex-shrink-0" /></span>
                ) : (
                  <span title="Private group"><Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" /></span>
                )}
                {group.slow_mode_duration && group.slow_mode_duration > 0 ? (
                  <span className="text-[10px]" title="Slow mode on">🐌</span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {group.member_count} members
              </p>
            </div>
          </button>
        )}
        <button className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted">
          <Search className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-breathe text-primary text-sm font-heading">Loading...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-base font-medium mb-1">Group created!</p>
                <p className="text-sm">Start the conversation 🎉</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isOwn = msg.sender_id === user?.id;
                const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const prevDate = i > 0 ? new Date(messages[i - 1].created_at).toDateString() : "";
                const currDate = new Date(msg.created_at).toDateString();
                const showDateSep = i === 0 || prevDate !== currDate;

                // System messages
                if (msg.message_type === "system") {
                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-pill">{getDateLabel(msg.created_at)}</span>
                        </div>
                      )}
                      <div className="flex justify-center my-2">
                        <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-pill">{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.is_deleted) {
                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-pill">{getDateLabel(msg.created_at)}</span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn ? "bg-bruchat-bubble-own" : "bg-bruchat-bubble-other"}`}>
                          <p className="text-xs italic text-muted-foreground">This message was deleted.</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Consecutive message grouping: show avatar/name only on first of group
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || prevMsg.message_type === "system" || prevDate !== currDate;

                return (
                  <div key={msg.id}>
                    {showDateSep && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-pill">{getDateLabel(msg.created_at)}</span>
                      </div>
                    )}
                    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                      {!isOwn && (
                        <div className="mr-2 flex-shrink-0 self-end w-8">
                          {isFirstInGroup ? (
                            msg.sender_avatar ? (
                              <img src={msg.sender_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                {msg.sender_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )
                          ) : null}
                        </div>
                      )}
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isOwn ? "bg-bruchat-bubble-own rounded-br-md" : "bg-bruchat-bubble-other rounded-bl-md"
                      }`}>
                        {!isOwn && isFirstInGroup && (
                          <p className="text-[11px] font-semibold text-primary mb-0.5">{msg.sender_name}</p>
                        )}
                        {msg.image_url && (
                          <img src={msg.image_url} alt="Shared" className="rounded-xl max-h-[260px] w-auto mb-2 cursor-pointer" loading="lazy" />
                        )}
                        {msg.video_url && (
                          <video src={msg.video_url} controls className="rounded-xl max-h-[260px] w-auto mb-2" />
                        )}
                        {msg.audio_url && (
                          <div className="mb-2">
                            <p className="text-[11px] text-muted-foreground mb-1">🎵 {msg.file_name || "Audio"}</p>
                            <audio src={msg.audio_url} controls className="w-full max-w-[240px] h-8" />
                          </div>
                        )}
                        {msg.file_url && (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-xl bg-background/50 border border-border mb-2 hover:bg-muted transition-colors">
                            <span className="text-lg">📄</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{msg.file_name || "File"}</p>
                              {msg.file_size ? <p className="text-[10px] text-muted-foreground">{(msg.file_size / 1024).toFixed(1)} KB</p> : null}
                            </div>
                            <span className="text-[10px] text-primary">Download</span>
                          </a>
                        )}
                        {msg.content && msg.message_type !== "image" && (
                          <p className="text-sm text-foreground break-words leading-relaxed">{msg.content}</p>
                        )}
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {msg.is_edited && <span className="text-[9px] text-muted-foreground italic">edited</span>}
                          <span className="text-[10px] text-muted-foreground">{time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Slow mode banner */}
          {slowCooldown > 0 && (
            <div className="px-4 py-2 bg-muted/50 border-t border-border text-center">
              <span className="text-xs text-muted-foreground">🐌 Slow mode — wait <span className="font-bold text-foreground">{slowCooldown}s</span></span>
            </div>
          )}

          {/* Input */}
          <div className="px-4 md:px-6 py-3 border-t border-border bg-card relative pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {showAttachMenu && (
              <AttachmentMenu onClose={() => setShowAttachMenu(false)} onFileSent={handleFileSend} />
            )}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="text-muted-foreground hover:text-foreground p-2">
                <Smile className="h-4 w-4" />
              </button>
              {newMessage.trim() ? (
                <>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={slowCooldown > 0 ? `Wait ${slowCooldown}s...` : `Message ${group?.name || ""}...`}
                      disabled={slowCooldown > 0}
                      className="w-full resize-none rounded-2xl bg-muted border-0 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32 disabled:opacity-50"
                      rows={1}
                      maxLength={1000}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending || slowCooldown > 0}
                    className={`p-2.5 rounded-full transition-all duration-200 ${
                      newMessage.trim() && slowCooldown === 0
                        ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--bruchat-accent-glow)/0.5)]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={slowCooldown > 0 ? `Wait ${slowCooldown}s...` : `Message ${group?.name || ""}...`}
                      disabled={slowCooldown > 0}
                      className="w-full resize-none rounded-2xl bg-muted border-0 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32 disabled:opacity-50"
                      rows={1}
                      maxLength={1000}
                    />
                  </div>
                  <VoiceRecorder onVoiceSent={handleFileSend} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Group Info Panel */}
        {showInfo && (
          <div className="w-72 border-l border-border bg-card overflow-y-auto scrollbar-thin hidden md:block">
            <div className="p-5 text-center border-b border-border">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-3">
                {group?.avatar_url ? (
                  <img src={group.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  group?.name.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="font-heading font-bold text-foreground">{group?.name}</h3>
              {group?.description && <p className="text-xs text-muted-foreground mt-1">{group.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">{group?.member_count} members</p>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1 border-b border-border">
              {isAdmin && (
                <button onClick={() => setShowAddMembers(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                  <UserPlus className="h-4 w-4 text-primary" /> Add Members
                </button>
              )}
              <button onClick={copyInviteLink} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                <Link2 className="h-4 w-4 text-primary" /> Copy invite link
              </button>
              {showLeaveConfirm ? (
                <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-destructive">Leave {group?.name}? You can rejoin anytime.</p>
                  <div className="flex gap-2">
                    <button onClick={leaveGroup} className="flex-1 text-xs py-1.5 rounded-lg bg-destructive text-destructive-foreground font-medium">Leave</button>
                    <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 text-xs py-1.5 rounded-lg bg-muted text-foreground font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowLeaveConfirm(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="h-4 w-4" /> Leave group
                </button>
              )}
            </div>

            {/* Members */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Members ({members.length})</p>
                {isAdmin && (
                  <button onClick={() => setShowAddMembers(true)} className="text-primary hover:text-primary/80">
                    <UserPlus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg group hover:bg-muted/50">
                    <div className="relative flex-shrink-0">
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                          {m.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      {m.profile?.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-bruchat-online" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{m.profile?.display_name || "Unknown"}</p>
                    </div>
                    {m.role === "admin" && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                    {isAdmin && m.user_id !== user?.id && m.role !== "admin" && (
                      <button
                        onClick={() => removeMember(m.user_id, m.profile?.username || "User")}
                        className="hidden group-hover:block text-muted-foreground hover:text-destructive"
                        title="Remove member"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddMembers && group && (
        <AddMembersModal
          groupId={groupId}
          groupName={group.name}
          currentUserId={user?.id || ""}
          existingMemberIds={members.map(m => m.user_id)}
          onClose={() => setShowAddMembers(false)}
          onMembersAdded={() => { fetchMembers(); if (group) setGroup({ ...group, member_count: (group.member_count || 0) + 1 }); }}
        />
      )}
    </div>
  );
};

export default GroupConversationView;
