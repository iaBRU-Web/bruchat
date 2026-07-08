import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

const ConnectionBanner = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 2500);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-xs text-center py-1.5 flex items-center justify-center gap-2 animate-slide-up-fade">
        <WifiOff className="h-3.5 w-3.5" /> No internet connection. Reconnecting...
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-bruchat-online text-white text-xs text-center py-1.5 flex items-center justify-center gap-2 animate-slide-up-fade">
        <Wifi className="h-3.5 w-3.5" /> Back online ✓
      </div>
    );
  }

  return null;
};

export default ConnectionBanner;
