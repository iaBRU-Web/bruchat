import { MessageCircle, Lock, Shield, ZoomIn } from "lucide-react";

const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background">
    <div className="relative mb-6">
      <MessageCircle className="h-20 w-20 text-muted-foreground/20" />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-bruchat-online/10 flex items-center justify-center">
        <Lock className="h-4 w-4 text-bruchat-online/40" />
      </div>
    </div>
    <h3 className="font-heading text-xl font-bold text-foreground mb-2">Pick a chat or find someone to talk to 👀</h3>
    <p className="text-sm text-muted-foreground max-w-xs mb-8">
      Your private messages are end-to-end encrypted. Start a conversation or create a group.
    </p>
    <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-pill bg-bruchat-online/5 text-bruchat-online text-xs">
      <Shield className="h-3.5 w-3.5" /> End-to-end encrypted
    </div>

    {/* Zoom tip */}
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-primary text-xs max-w-xs">
      <ZoomIn className="h-3.5 w-3.5 flex-shrink-0" />
      <span>For the best experience, set your browser zoom to <strong>80% or less</strong> (Ctrl&nbsp;−&nbsp;or&nbsp;⌘&nbsp;−)</span>
    </div>

    {/* Featured section */}
    <div className="w-full max-w-md mt-8">
      <p className="text-xs text-muted-foreground mb-3 font-medium">Featured ✨</p>
      <div className="grid grid-cols-1 gap-3">
        <a
          href="https://bru-claude.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all group bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center gap-3 p-4"
        >
          <span className="text-3xl">🤖</span>
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Chat with Bruno's AI</p>
            <p className="text-[10px] text-muted-foreground">Try bru-claude.lovable.app</p>
          </div>
        </a>
      </div>
    </div>
  </div>
);

export default EmptyState;
