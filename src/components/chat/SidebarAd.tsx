import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ads = [
  {
    emoji: "🤖",
    text: "Chat with Bruno's AI",
    sub: "bru-claude.lovable.app",
    url: "https://bru-claude.lovable.app",
  },
  {
    emoji: "🎵",
    text: "Eazy Chop Muzik",
    sub: "Subscribe on YouTube",
    url: "https://youtube.com/channel/UCbj_88MfRErvm6baRPmK-DA?sub_confirmation=1",
  },
  {
    emoji: "🌐",
    text: "NESTOR NATION™",
    sub: "eazychannel.vercel.app",
    url: "https://eazychannel.vercel.app",
  },
  {
    emoji: "💼",
    text: "Hire Bruno",
    sub: "bru-cv.vercel.app",
    url: "https://bru-cv.vercel.app",
  },
];

const SidebarAd = () => {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [fade, setFade] = useState(true);
  const [minimized, setMinimized] = useState(() => localStorage.getItem("bruchat-ad-min") === "true");

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ads.length);
        setFade(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const ad = ads[index];

  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); localStorage.setItem("bruchat-ad-min", "false"); }}
        className="mx-1.5 mb-2 h-2 rounded-full bg-primary/30 hover:bg-primary/50 transition-colors cursor-pointer"
        title="Show ad"
      />
    );
  }

  return (
    <div className="relative mx-1.5 mb-2">
      <a
        href={ad.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-2 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-all duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{ad.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-foreground truncate">{ad.text}</p>
            <p className="text-[9px] text-muted-foreground truncate">{ad.sub}</p>
          </div>
        </div>
      </a>
      <div className="absolute top-1 right-1 flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); setMinimized(true); localStorage.setItem("bruchat-ad-min", "true"); }}
          className="p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Minimize"
        >
          <span className="text-[8px]">▼</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
};

export default SidebarAd;
