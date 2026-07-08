import { X, ExternalLink, Play } from "lucide-react";

const videos = [
  { id: "oTqs80xS9KE", views: "148k views" },
  { id: "eS2qpDM13mw", views: "47k views" },
  { id: "_iWYrJhvJVE", views: "4.3k views" },
  { id: "OwKFc20XD1w", views: "2.2k views" },
  { id: "s9AsMIJacNQ", views: "2.1k views" },
];

const CHANNEL_URL = "https://youtube.com/channel/UCbj_88MfRErvm6baRPmK-DA?sub_confirmation=1";

const EazyChopPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div>
          <h2 className="font-heading font-bold text-foreground">🎵 Eazy Chop Muzik</h2>
          <p className="text-xs text-muted-foreground">Rwandan music creator</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-full hover:bg-red-700 transition-colors"
          >
            Subscribe
          </a>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {videos.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/shorts/${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors group"
          >
            <div className="relative">
              <img
                src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                alt="Eazy Chop"
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="p-3 bg-card flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">🎵 Eazy Chop Muzik</p>
                <p className="text-xs text-muted-foreground">{v.views} • YouTube Shorts</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </a>
        ))}

        <div className="pt-4 border-t border-border text-center space-y-1">
          <p className="text-xs text-muted-foreground">Contact: eazychop45@gmail.com | +250794677383</p>
          <p className="text-[10px] text-muted-foreground">Special thanks to INEZA AIME BRUNO, HIRWA EMERY BLESSING</p>
        </div>
      </div>
    </div>
  );
};

export default EazyChopPanel;
