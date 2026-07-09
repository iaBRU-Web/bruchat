import { useState, useEffect } from "react";
import { ZoomIn, X } from "lucide-react";

const ZoomBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner if zoom level is above 85% (devicePixelRatio trick)
    const dismissed = localStorage.getItem("bruchat-zoom-banner-dismissed");
    if (dismissed) return;

    const checkZoom = () => {
      const zoom = Math.round((window.outerWidth / window.innerWidth) * 100);
      setVisible(zoom > 85);
    };

    checkZoom();
    window.addEventListener("resize", checkZoom);
    return () => window.removeEventListener("resize", checkZoom);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("bruchat-zoom-banner-dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium shadow-md">
      <ZoomIn className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        For the best experience, zoom out to <strong>80% or less</strong> —&nbsp;
        press <kbd className="px-1 py-0.5 rounded bg-primary-foreground/20 font-mono text-[10px]">Ctrl −</kbd> (Windows) or&nbsp;
        <kbd className="px-1 py-0.5 rounded bg-primary-foreground/20 font-mono text-[10px]">⌘ −</kbd> (Mac)
      </span>
      <button onClick={dismiss} className="ml-2 hover:opacity-70 transition-opacity" title="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default ZoomBanner;
