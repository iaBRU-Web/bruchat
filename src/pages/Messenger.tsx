import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/chat/AppSidebar";
import Inbox from "@/components/chat/Inbox";
import ConversationView from "@/components/chat/ConversationView";
import GroupConversationView from "@/components/chat/GroupConversationView";
import EmptyState from "@/components/chat/EmptyState";
import ConnectionBanner from "@/components/chat/ConnectionBanner";
import KeyboardShortcuts from "@/components/chat/KeyboardShortcuts";
import AiExplainerPanel from "@/components/chat/AiExplainerPanel";
import ZoomBanner from "@/components/chat/ZoomBanner";
import { X, Sparkles } from "lucide-react";

const Messenger = () => {
  const { conversationId, groupId } = useParams();
  const { profile } = useAuth();
  const [isMobileInboxOpen, setIsMobileInboxOpen] = useState(!conversationId && !groupId);
  const [showAI, setShowAI] = useState(false);
  const [showAiExplainer, setShowAiExplainer] = useState(() => localStorage.getItem("bruchat-ai-explainer") === "true");
  const [showAiMobile, setShowAiMobile] = useState(false);
  const [aiWidth] = useState(() => parseInt(localStorage.getItem("bruchat-ai-width") || "400"));

  useEffect(() => {
    if (conversationId || groupId) {
      setIsMobileInboxOpen(false);
    }
  }, [conversationId, groupId]);

  const handleBackToInbox = useCallback(() => {
    setIsMobileInboxOpen(true);
  }, []);

  const toggleAi = () => {
    const next = !showAiExplainer;
    setShowAiExplainer(next);
    localStorage.setItem("bruchat-ai-explainer", String(next));
  };

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      <h1 className="sr-only">BRUChat Messenger — your conversations</h1>
      <ConnectionBanner />
      <KeyboardShortcuts />
      <ZoomBanner />

      {/* Left sidebar */}
      <div className="hidden md:flex">
        <AppSidebar
          onOpenAI={() => setShowAI(!showAI)}
        />
      </div>

      {/* Middle - inbox */}
      <div className={`w-full md:w-[300px] md:min-w-[300px] border-r border-border flex-shrink-0 min-h-0 ${
        !isMobileInboxOpen && (conversationId || groupId) ? "hidden md:flex md:flex-col" : "flex flex-col"
      }`}>
        <Inbox />
      </div>

      {/* Right - conversation + optional AI explainer */}
      <div className={`flex-1 min-w-0 min-h-0 flex ${
        isMobileInboxOpen && !conversationId && !groupId ? "hidden md:flex" : "flex"
      }`}>
        {/* Chat area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col relative">
          {conversationId ? (
            <ConversationView conversationId={conversationId} onBack={handleBackToInbox} />
          ) : groupId ? (
            <GroupConversationView groupId={groupId} onBack={handleBackToInbox} />
          ) : (
            <EmptyState />
          )}

          {/* Floating BRU AI pill — desktop (when panel hidden) + mobile (always) */}
          {!showAiExplainer && (
            <button
              onClick={() => {
                if (window.innerWidth < 768) setShowAiMobile(true);
                else toggleAi();
              }}
              className="absolute bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform font-heading font-semibold text-sm"
              title="Open BRU AI"
            >
              <Sparkles className="h-4 w-4" />
              BRU AI
            </button>
          )}
        </div>

        {/* AI Explainer Panel — desktop */}
        {showAiExplainer && (
          <div className="w-[340px] border-l border-border flex-shrink-0 hidden md:flex min-h-0">
            <div className="w-full h-full">
              <AiExplainerPanel onClose={toggleAi} />
            </div>
          </div>
        )}
      </div>

      {/* AI Explainer — mobile full-screen overlay */}
      {showAiMobile && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background animate-slide-up-fade">
          <AiExplainerPanel onClose={() => setShowAiMobile(false)} />
        </div>
      )}

      {/* AI Panel (Bruno AI iframe) */}
      {showAI && (
        <div style={{ width: aiWidth }} className="border-l border-border flex-shrink-0 hidden md:flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h3 className="font-heading font-bold text-foreground text-sm">Bruno AI</h3>
            </div>
            <button onClick={() => setShowAI(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <iframe
            src="https://bru-claude.lovable.app"
            className="flex-1 w-full border-0"
            title="BRU Claude AI"
            allow="clipboard-write"
          />
        </div>
      )}

      {/* Mobile bottom nav — hidden when inside a conversation so composer isn't covered */}
      {!(conversationId || groupId) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
          <AppSidebar mobile />
        </div>
      )}
    </div>
  );
};

export default Messenger;
