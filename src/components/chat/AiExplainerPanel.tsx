import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Trash2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

declare global {
  interface Window { puter: any; }
}

const MODEL_GROUPS = [
  {
    group: "🤖 Anthropic Claude",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", tag: "Fast" },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", tag: "Stable" },
      { id: "claude-opus-4-6", label: "Claude Opus 4.6", tag: "Smart" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7", tag: "Smarter" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8", tag: "Smartest" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5", tag: "⭐ Latest" },
    ],
  },
  {
    group: "✨ OpenAI",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini", tag: "Fast · Free" },
      { id: "gpt-4o", label: "GPT-4o", tag: "Smart" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", tag: "Powerful" },
      { id: "o1-mini", label: "o1 Mini", tag: "Reasoning" },
      { id: "o1", label: "o1", tag: "Best reasoning" },
    ],
  },
  {
    group: "🌟 Google Gemini",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tag: "⚡ Fastest" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tag: "Smart" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "⭐ Best" },
    ],
  },
  {
    group: "⚡ Meta Llama (Groq)",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", tag: "⚡ Fast" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", tag: "⚡ Ultra fast" },
      { id: "llama-3.1-70b-versatile", label: "Llama 3.1 70B", tag: "Powerful" },
    ],
  },
  {
    group: "🔥 Mistral",
    models: [
      { id: "mistral-large-latest", label: "Mistral Large", tag: "Smart" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", tag: "Fast" },
    ],
  },
];

const ALL_MODELS = MODEL_GROUPS.flatMap(g => g.models);
const DEFAULT_MODEL = "gpt-4o-mini";

const AiExplainerPanel = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("User");
  const [puterReady, setPuterReady] = useState(false);
  const [modelId, setModelId] = useState(() => localStorage.getItem("bru-ai-model") || DEFAULT_MODEL);
  const [modelOpen, setModelOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const currentModel = ALL_MODELS.find(m => m.id === modelId) || ALL_MODELS[0];

  useEffect(() => { localStorage.setItem("bru-ai-model", modelId); }, [modelId]);

  // Load Puter.js
  useEffect(() => {
    if (window.puter) { setPuterReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => setPuterReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles").select("display_name").eq("id", user.id).single();
      if (profile?.display_name) setUserName(profile.display_name);

      const { data: saved } = await supabase
        .from("ai_chat_messages").select("role, content")
        .eq("user_id", user.id).order("created_at", { ascending: true }).limit(100);
      if (saved?.length) {
        setMessages(saved.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
    };
    load();
  }, [user]);

  const persistMessage = useCallback(async (msg: Msg) => {
    if (!user) return;
    await supabase.from("ai_chat_messages").insert({ user_id: user.id, role: msg.role, content: msg.content });
  }, [user]);

  const clearChat = async () => {
    setMessages([]);
    if (user) await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !puterReady) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    persistMessage(userMsg);

    const systemPrompt = `You are BRU AI, a friendly smart assistant built into BRUChat by INEZA AIME BRUNO in Kigali, Rwanda. The user's name is ${userName}. Be concise, friendly, and helpful. Use emojis occasionally.`;

    try {
      const puterMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg.content },
      ];

      let assistantText = "";
      setMessages(prev => [...prev, { role: "assistant", content: "..." }]);

      const response = await window.puter.ai.chat(puterMessages, {
        model: modelId,
        stream: true,
      });

      for await (const chunk of response) {
        const content = chunk?.text || chunk?.choices?.[0]?.delta?.content || "";
        if (content) {
          assistantText += content;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: assistantText };
            return updated;
          });
        }
      }

      if (assistantText) persistMessage({ role: "assistant", content: assistantText });
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: `❌ ${err.message || "Something went wrong. Try a different model."}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground text-sm">BRU AI</h3>
            {isLoading && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">thinking…</span>}
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
              <span className="font-medium text-foreground truncate">{currentModel.label}</span>
              <span className="text-muted-foreground text-[10px] flex-shrink-0">{currentModel.tag}</span>
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0 ${modelOpen ? "rotate-180" : ""}`} />
          </button>

          {modelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {MODEL_GROUPS.map(group => (
                <div key={group.group}>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                    {group.group}
                  </div>
                  {group.models.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setModelId(opt.id); setModelOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 ${opt.id === modelId ? "bg-primary/10 text-primary" : ""}`}
                    >
                      <span className="font-medium truncate">{opt.label}</span>
                      <span className="text-muted-foreground text-[10px] flex-shrink-0">{opt.tag}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
            <Sparkles className="h-10 w-10 text-primary/30" />
            <p className="text-sm font-medium">Hi {userName}! I'm BRU AI 👋</p>
            <p className="text-xs max-w-[240px]">Powered by Puter.js — free AI for everyone. Pick a model and ask me anything!</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {["What can you do?", "Tell me about BRUChat", "Help me write a message"].map(q => (
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
                <div className="prose prose-sm max-w-none [&>p]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="break-words">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={puterReady ? `Ask ${currentModel.label}...` : "Loading AI..."}
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoading || !puterReady}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !puterReady}
            className={`p-2 rounded-full transition-all ${input.trim() && puterReady ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">Powered by Puter.js · Free for all users 🖤</p>
      </div>
    </div>
  );
};

export default AiExplainerPanel;
