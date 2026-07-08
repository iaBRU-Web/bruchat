import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Trash2, ChevronDown, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const MODEL_OPTIONS: { id: string; label: string; tag: string }[] = [
  { id: "lovable-gemini-flash", label: "BRU AI (Gemini Flash)", tag: "Default · Free" },
  { id: "groq-llama-70b",       label: "Groq Llama 3.3 70B",    tag: "⚡ Fastest" },
  { id: "groq-llama-8b",        label: "Groq Llama 3.1 8B",     tag: "⚡ Ultra fast" },
  { id: "groq-mixtral",         label: "Groq Mixtral 8x7B",     tag: "⚡ Fast" },
  { id: "openai-gpt-4o-mini",   label: "OpenAI GPT-4o mini",    tag: "Smart" },
  { id: "openai-gpt-4o",        label: "OpenAI GPT-4o",         tag: "Premium" },
  { id: "gemini-2.0-flash",     label: "Gemini 2.0 Flash",      tag: "Fast" },
  { id: "gemini-1.5-pro",       label: "Gemini 1.5 Pro",        tag: "Premium" },
  { id: "lovable-gpt-5",        label: "GPT-5 (via BRU)",       tag: "Top reasoning" },
  { id: "lovable-gemini-pro",   label: "Gemini 2.5 Pro (via BRU)", tag: "Top reasoning" },
];

const AiExplainerPanel = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("User");
  const [modelId, setModelId] = useState<string>(() => localStorage.getItem("bru-ai-model") || "lovable-gemini-flash");
  const [modelOpen, setModelOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const currentModel = MODEL_OPTIONS.find(m => m.id === modelId) || MODEL_OPTIONS[0];

  useEffect(() => { localStorage.setItem("bru-ai-model", modelId); }, [modelId]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load user name and chat history on mount
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      // Fetch display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (profile?.display_name) setUserName(profile.display_name);

      // Fetch persisted messages
      const { data: saved } = await supabase
        .from("ai_chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (saved?.length) {
        setMessages(saved.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
    };
    load();
  }, [user]);

  const persistMessage = useCallback(async (msg: Msg) => {
    if (!user) return;
    await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: msg.role,
      content: msg.content,
    });
  }, [user]);

  const getRecentActivity = useCallback(async () => {
    if (!user) return "";
    const parts: string[] = [];

    const { data: convos } = await supabase
      .from("conversations")
      .select("id,participant_a,participant_b,last_message_at")
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order("last_message_at", { ascending: false })
      .limit(5);

    if (convos?.length) {
      const otherIds = convos.map(c => c.participant_a === user.id ? c.participant_b : c.participant_a);
      const { data: profiles } = await supabase.from("profiles").select("id,display_name").in("id", otherIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.id] = p.display_name; });

      for (const c of convos.slice(0, 3)) {
        const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        const { data: msgs } = await supabase
          .from("messages")
          .select("content,sender_id,created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (msgs?.length) {
          parts.push(`Chat with ${nameMap[otherId] || "someone"}: last messages: ${msgs.map(m => `"${(m.content || "").slice(0, 80)}" (${m.sender_id === user.id ? "you" : nameMap[otherId] || "them"})`).join(", ")}`);
        }
      }
    }

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .limit(5);

    if (memberships?.length) {
      const groupIds = memberships.map(m => m.group_id);
      const { data: groups } = await supabase.from("groups").select("id,name").in("id", groupIds);
      const groupNameMap: Record<string, string> = {};
      groups?.forEach(g => { groupNameMap[g.id] = g.name; });

      for (const gid of groupIds.slice(0, 3)) {
        const { data: gmsgs } = await supabase
          .from("group_messages")
          .select("content,sender_id,created_at")
          .eq("group_id", gid)
          .order("created_at", { ascending: false })
          .limit(3);
        if (gmsgs?.length) {
          parts.push(`Group "${groupNameMap[gid] || gid}": recent messages: ${gmsgs.map(m => `"${(m.content || "").slice(0, 80)}"`).join(", ")}`);
        }
      }
    }

    const { data: notifs } = await supabase
      .from("notifications")
      .select("type,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (notifs?.length) {
      parts.push(`Recent notifications: ${notifs.map(n => n.type).join(", ")}`);
    }

    return parts.join("\n\n") || "No recent activity found.";
  }, [user]);

  const clearChat = async () => {
    setMessages([]);
    if (user) {
      await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Persist user message
    persistMessage(userMsg);

    try {
      const recentActivity = await getRecentActivity();
      const allMessages = [...messages, userMsg];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          recentActivity,
          userName,
          modelId,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to connect to AI");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantSoFar = "";
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Persist final assistant message
      if (assistantSoFar) {
        persistMessage({ role: "assistant", content: assistantSoFar });
      }
    } catch (err: any) {
      const errMsg = `❌ ${err.message || "Something went wrong"}`;
      setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      <div className="px-4 py-3 border-b border-border space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <h3 className="font-heading font-bold text-foreground text-sm">BRU AI</h3>
            {isLoading && (
              <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">streaming…</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted" title="Clear chat">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Model picker */}
        <div className="relative">
          <button
            onClick={() => setModelOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 text-xs transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground truncate">{currentModel.label}</span>
              <span className="text-muted-foreground text-[10px] flex-shrink-0">{currentModel.tag}</span>
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${modelOpen ? "rotate-180" : ""}`} />
          </button>
          {modelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
              {MODEL_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setModelId(opt.id); setModelOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 ${opt.id === modelId ? "bg-muted" : ""}`}
                >
                  <span className="font-medium text-foreground truncate">{opt.label}</span>
                  <span className="text-muted-foreground text-[10px] flex-shrink-0">{opt.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
            <Sparkles className="h-10 w-10 text-primary/30" />
            <p className="text-sm font-medium">Hi {userName}! I'm BRU AI 👋</p>
            <p className="text-xs max-w-[240px]">I can see your recent chats and activity. Ask me anything about what's going on!</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {["What's new in my chats?", "Summarize my activity", "Who messaged me?"].map(q => (
                <button key={q} onClick={() => setInput(q)} className="text-[11px] px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="break-words">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask BRU AI anything..."
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full transition-all ${input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiExplainerPanel;
