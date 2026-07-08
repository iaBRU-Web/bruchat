import { MessageCircle, Lock, Shield, ExternalLink, Play } from "lucide-react";

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
    <div className="flex items-center gap-2 mb-10 px-4 py-2 rounded-pill bg-bruchat-online/5 text-bruchat-online text-xs">
      <Shield className="h-3.5 w-3.5" /> End-to-end encrypted
    </div>

    {/* Featured section */}
    <div className="w-full max-w-md">
      <p className="text-xs text-muted-foreground mb-3 font-medium">Featured ✨</p>
      <div className="grid grid-cols-2 gap-3">
        <a
          href="https://www.youtube.com/shorts/oTqs80xS9KE"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all group"
        >
          <div className="relative">
            <img
              src="https://img.youtube.com/vi/oTqs80xS9KE/mqdefault.jpg"
              alt="Eazy Chop"
              className="w-full aspect-video object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center shadow-lg">
                <Play className="h-4 w-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
          <div className="p-2.5 bg-card">
            <p className="text-xs font-semibold text-foreground">Eazy Chop Muzik 🎵</p>
            <p className="text-[10px] text-muted-foreground">148k views • Watch now</p>
          </div>
        </a>
        <a
          href="https://bru-claude.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all group bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center p-4"
        >
          <span className="text-3xl mb-2">🤖</span>
          <p className="text-xs font-semibold text-foreground">Chat with Bruno's AI</p>
          <p className="text-[10px] text-muted-foreground">Try bru-claude.lovable.app</p>
        </a>
      </div>
    </div>
  </div>
);

export default EmptyState;
