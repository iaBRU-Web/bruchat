import { ExternalLink, Play } from "lucide-react";

const BRU_PROJECTS: Record<string, { name: string; emoji: string; desc: string }> = {
  "bru-claude.lovable.app": { name: "BRU Claude AI", emoji: "🤖", desc: "Bruno's personal AI assistant" },
  "brumsg.lovable.app": { name: "BRUChat Messenger", emoji: "💬", desc: "Private encrypted messenger" },
  "bruno-gpt5.vercel.app": { name: "Bruno GPT5", emoji: "🧠", desc: "AI Assistant" },
  "bru-kart.vercel.app": { name: "BRU Kart", emoji: "🏎️", desc: "Racing Game" },
  "brufite.vercel.app": { name: "BRUFite", emoji: "🥊", desc: "Fitness App" },
  "piano-bru.vercel.app": { name: "BRU Piano", emoji: "🎹", desc: "Virtual Piano" },
  "bru-cv.vercel.app": { name: "Bruno's CV", emoji: "💼", desc: "Portfolio & Resume" },
  "gta-kgl.vercel.app": { name: "GTA Kigali", emoji: "🏙️", desc: "Kigali Explorer" },
  "eazychannel.vercel.app": { name: "NESTOR NATION™", emoji: "🌐", desc: "Eazy Chop Muzik" },
};

const EAZY_CHOP_VIDEOS: Record<string, string> = {
  "oTqs80xS9KE": "148k views",
  "eS2qpDM13mw": "47k views",
  "_iWYrJhvJVE": "4.3k views",
  "OwKFc20XD1w": "2.2k views",
  "s9AsMIJacNQ": "2.1k views",
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export function getLinksFromText(text: string): string[] {
  if (!text) return [];
  const regex = /(https?:\/\/[^\s<]+|www\.[^\s<]+|\S+\.(com|app|io|net|org|rw|gg|co|ly)(\/[^\s<]*)?)/gi;
  return (text.match(regex) || []);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  // Strip control chars + javascript: schemes for href safety
  const cleaned = s.replace(/[\u0000-\u001f]/g, "").trim();
  if (/^\s*javascript:/i.test(cleaned)) return "#";
  return escapeHtml(cleaned);
}

export function renderLinkedText(text: string): string {
  if (!text) return text;
  // 1) Escape ALL user input first so injected tags can't execute
  let html = escapeHtml(text);
  // 2) Apply markdown to the escaped output (capture groups are already safe)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  // 3) Linkify (operating on the already-escaped text)
  html = html.replace(
    /(https?:\/\/[^\s<]+|www\.[^\s<]+|\S+\.(com|app|io|net|org|rw|gg|co|ly)(\/[^\s<]*)?)/gi,
    (match) => {
      const href = match.startsWith("http") ? match : `https://${match}`;
      return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" class="text-primary underline decoration-primary/40 hover:decoration-primary transition-colors">${match}</a>`;
    },
  );
  return html;
}


interface LinkPreviewProps {
  url: string;
}

const LinkPreview = ({ url }: LinkPreviewProps) => {
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  const domain = extractDomain(url);
  const ytId = extractYouTubeId(fullUrl);

  // YouTube preview
  if (ytId) {
    const isEazyChop = EAZY_CHOP_VIDEOS[ytId];
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 max-w-[300px] rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors">
        <div className="relative">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt="YouTube"
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
        <div className="p-2.5 bg-card">
          <p className="text-xs font-semibold text-foreground truncate">
            {isEazyChop ? `🎵 Eazy Chop Muzik` : "YouTube Video"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isEazyChop ? `${isEazyChop} • YouTube Shorts` : "youtube.com"}
          </p>
        </div>
      </a>
    );
  }

  // BRU project card
  const project = BRU_PROJECTS[domain];
  if (project) {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 max-w-[300px] rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors">
        <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center gap-3">
          <span className="text-2xl">{project.emoji}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{project.name}</p>
            <p className="text-[10px] text-muted-foreground">{project.desc}</p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
        </div>
      </a>
    );
  }

  return null;
};

export default LinkPreview;
