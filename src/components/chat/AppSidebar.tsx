import { MessageCircle, Users, Bell, Settings, LogOut, Moon, Sun, Grid3X3, Compass, Music, Star, Trophy, Film, Youtube } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SidebarAd from "./SidebarAd";

interface AppSidebarProps {
  mobile?: boolean;
  onOpenMusic?: () => void;
  onOpenAI?: () => void;
}

const AppSidebar = ({ mobile, onOpenMusic, onOpenAI }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (profile) {
      setIsDark(profile.theme === "dark");
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false)
        .then(({ count }) => setUnreadNotifs(count ?? 0));
    }
  }, [profile]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = async () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("bruchat-theme", newTheme);
    if (profile) {
      await supabase.from("profiles").update({ theme: newTheme }).eq("id", profile.id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { icon: MessageCircle, label: "Chats", path: "/app" },
    { icon: Users, label: "People", path: "/app/people" },
    { icon: Grid3X3, label: "Posts", path: "/posts" },
    { icon: Film, label: "Reels", path: "/reel" },
    { icon: Youtube, label: "YouTube", path: "/youtube" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Bell, label: "Notifications", path: "/app/notifications", badge: unreadNotifs },
    { icon: Trophy, label: "Achievements", path: "/achievements" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/app") return location.pathname === "/app" || (location.pathname.startsWith("/app/") && !location.pathname.includes("/people") && !location.pathname.includes("/notifications") && !location.pathname.includes("/group"));
    if (path === "/app/group") return location.pathname.startsWith("/app/group");
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  if (mobile) {
    const mobileItems = navItems.filter(i => ["Chats", "People", "Posts", "Explore", "Notifications"].includes(i.label));
    return (
      <div className="bg-card border-t border-border flex items-center justify-around px-2 py-2.5 safe-area-pb">
        {mobileItems.map((item) => {
          const isActive = isActivePath(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge ? (
                <span className="absolute -top-0.5 right-0 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-[72px] bg-card border-r border-border flex flex-col items-center py-5 gap-2">
      {/* Logo */}
      <button onClick={() => navigate("/app")} className="mb-6 group">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <MessageCircle className="h-5 w-5 text-primary animate-breathe" />
        </div>
      </button>

      {/* Nav */}
      <div className="flex-1 flex flex-col items-center gap-1.5">
        {navItems.map((item) => {
          const isActive = isActivePath(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--bruchat-accent-glow)/0.2)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
              {item.badge ? (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Music */}
        <button
          onClick={onOpenMusic}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Eazy Chop Muzik"
        >
          <Music className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2">
        {/* Ad */}
        <SidebarAd />

        {/* AI Chat */}
        <button
          onClick={onOpenAI}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-yellow-500 hover:bg-yellow-500/10 transition-all"
          title="Chat with Bruno AI"
        >
          <Star className="h-5 w-5" />
        </button>

        {profile?.avatar_url ? (
          <button
            onClick={() => navigate(`/user/${profile.username}`)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors"
          >
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          </button>
        ) : (
          <button
            onClick={() => navigate(`/user/${profile?.username}`)}
            className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold hover:bg-primary/30 transition-colors"
          >
            {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={handleSignOut}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AppSidebar;
