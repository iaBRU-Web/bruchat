import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  status_text: string;
  is_online: boolean;
  last_seen: string;
  is_banned: boolean;
  theme: string;
  sound_notifications: boolean;
  desktop_notifications: boolean;
  show_typing: boolean;
  show_read_receipts: boolean;
  show_online_status: boolean;
  show_last_seen: boolean;
  font_size: string;
  bubble_style: string;
  chat_wallpaper: string;
  profile_views: number;
  public_key: string;
  away_status: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,banner_url,bio,status_text,is_online,last_seen,is_banned,theme,sound_notifications,desktop_notifications,show_typing,show_read_receipts,show_online_status,show_last_seen,font_size,bubble_style,chat_wallpaper,profile_views,public_key,away_status,created_at")
        .eq("id", userId)
        .single();
      if (data) {
        setProfile(data as Profile);
        // Apply saved theme and persist to localStorage
        const savedTheme = (data as Profile).theme || "dark";
        localStorage.setItem("bruchat-theme", savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // Profile fetch failed, continue anyway
    }
  }, []);

  const setOnlineStatus = useCallback(async (userId: string, online: boolean) => {
    try {
      await supabase
        .from("profiles")
        .update({ is_online: online, last_seen: new Date().toISOString() })
        .eq("id", userId);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    // Fallback: force loading=false after 8 seconds no matter what
    loadingTimeout.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 8000);

    // Set up auth listener FIRST, then get session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          // Use setTimeout to avoid blocking the callback
          setTimeout(() => {
            fetchProfile(sess.user.id);
            setOnlineStatus(sess.user.id, true);
          }, 0);
        } else {
          setProfile(null);
        }
        if (!initialized.current) {
          initialized.current = true;
          setLoading(false);
          if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!initialized.current) {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          fetchProfile(sess.user.id);
          setOnlineStatus(sess.user.id, true);
        }
        initialized.current = true;
        setLoading(false);
        if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      }
    });

    const handleBeforeUnload = () => {
      const currentUser = user;
      if (currentUser) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`,
          JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    if (user) await setOnlineStatus(user.id, false);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, [user, setOnlineStatus]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
