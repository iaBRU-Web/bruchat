import VerifiedBadge from "@/components/VerifiedBadge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/chat/AppSidebar";
import Footer from "@/components/Footer";

interface NotifRow {
  id: string;
  type: string;
  from_user_id: string | null;
  conversation_id: string | null;
  group_id: string | null;
  is_read: boolean;
  created_at: string;
  from_profile?: { display_name: string; avatar_url: string; username: string };
}

const formatTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
};

const notifText = (type: string, name: string) => {
  switch (type) {
    case "message": return `${name} sent you a message`;
    case "group_message": return `${name} sent a message in your group`;
    case "follow": return `${name} started following you`;
    case "reaction": return `${name} reacted to your message`;
    case "mention": return `${name} mentioned you`;
    default: return `${name} did something`;
  }
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,from_user_id,conversation_id,group_id,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        const fromIds = [...new Set(data.filter((n) => n.from_user_id).map((n) => n.from_user_id!))];
        let profileMap: Record<string, { display_name: string; avatar_url: string; username: string }> = {};
        if (fromIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id,display_name,avatar_url,username")
            .in("id", fromIds);
          profiles?.forEach((p) => { profileMap[p.id] = p; });
        }
        setNotifs(data.map((n) => ({
          ...n,
          from_profile: n.from_user_id ? profileMap[n.from_user_id] : undefined,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = async (n: NotifRow) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.conversation_id) navigate(`/app/${n.conversation_id}`);
    else if (n.group_id) navigate(`/app/group/${n.group_id}`);
    else if (n.from_profile) navigate(`/user/${n.from_profile.username}`);
  };

  return (
    <div className="h-[100dvh] bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pb-safe-nav">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-2xl font-bold text-foreground">Notifications</h1>
            <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs text-muted-foreground">
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-48 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-muted/50 ${
                    !n.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  {n.from_profile?.avatar_url ? (
                    <img src={n.from_profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                      {n.from_profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground flex items-center gap-1 flex-wrap">{notifText(n.type, n.from_profile?.display_name || "Someone")} <VerifiedBadge username={n.from_profile?.username} /></p>
                    <p className="text-xs text-muted-foreground">{formatTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AppSidebar mobile />
      </div>
    </div>
  );
};

export default Notifications;
