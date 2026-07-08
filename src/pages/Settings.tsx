import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Palette, Bell, Shield, Star, AlertTriangle, Eye, EyeOff, Check, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "starred", label: "Starred", icon: Star },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

const SettingsPage = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [statusText, setStatusText] = useState("");
  const [saving, setSaving] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Appearance
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("medium");
  const [bubbleStyle, setBubbleStyle] = useState("rounded");
  const [wallpaper, setWallpaper] = useState("solid");

  // Notifications
  const [soundNotifs, setSoundNotifs] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const [showReceipts, setShowReceipts] = useState(true);

  // Privacy
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeenSetting] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  // Danger
  const [deleteUsername, setDeleteUsername] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio);
      setStatusText(profile.status_text);
      setTheme(profile.theme);
      setFontSize(profile.font_size);
      setBubbleStyle(profile.bubble_style);
      setWallpaper(profile.chat_wallpaper);
      setSoundNotifs(profile.sound_notifications);
      setDesktopNotifs(profile.desktop_notifications);
      setShowTyping(profile.show_typing);
      setShowReceipts(profile.show_read_receipts);
      setShowOnline(profile.show_online_status);
      setShowLastSeenSetting(profile.show_last_seen);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === "privacy" && user) {
      supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id,username,display_name,avatar_url")
              .in("id", data.map((b) => b.blocked_id));
            setBlockedUsers(profiles || []);
          } else {
            setBlockedUsers([]);
          }
        });
    }
  }, [activeTab, user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      display_name: displayName.replace(/<[^>]*>/g, "").trim(),
      bio: bio.replace(/<[^>]*>/g, "").trim(),
      status_text: statusText.replace(/<[^>]*>/g, "").trim(),
    }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
    toast({ title: "Profile saved! ✨" });
  };

  const saveAppearance = async () => {
    if (!user) return;
    await supabase.from("profiles").update({
      theme, font_size: fontSize, bubble_style: bubbleStyle, chat_wallpaper: wallpaper,
    }).eq("id", user.id);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    await refreshProfile();
    toast({ title: "Appearance saved! 🎨" });
  };

  const saveNotifications = async () => {
    if (!user) return;
    if (desktopNotifs && "Notification" in window) {
      await Notification.requestPermission();
    }
    await supabase.from("profiles").update({
      sound_notifications: soundNotifs,
      desktop_notifications: desktopNotifs,
      show_typing: showTyping,
      show_read_receipts: showReceipts,
    }).eq("id", user.id);
    await refreshProfile();
    toast({ title: "Notification settings saved! 🔔" });
  };

  const savePrivacy = async () => {
    if (!user) return;
    await supabase.from("profiles").update({
      show_online_status: showOnline,
      show_last_seen: showLastSeen,
    }).eq("id", user.id);
    await refreshProfile();
    toast({ title: "Privacy settings saved! 🔒" });
  };

  const changePassword = async () => {
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match. Double-check!", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "Come on, at least 6 characters — we believe in you 💪", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "That's not your current password. Try again!", variant: "destructive" });
    } else {

      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast({ title: "Password updated! Stay safe out there 🔐" });
    }
  };

  const unblockUser = async (blockedId: string) => {
    if (!user) return;
    await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
    setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
    toast({ title: "User unblocked" });
  };

  const deleteAccount = async () => {
    if (!user || !profile || deleteUsername !== profile.username) return;
    // Delete user data
    await supabase.from("messages").delete().eq("sender_id", user.id);
    await supabase.from("group_messages").delete().eq("sender_id", user.id);
    await supabase.from("group_members").delete().eq("user_id", user.id);
    await supabase.from("follows").delete().or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
    await supabase.from("notifications").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await signOut();
    navigate("/");
    toast({ title: "Account deleted. Sorry to see you go 👋" });
  };

  const PillToggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${value ? "left-[26px]" : "left-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs */}
          <div className="md:w-48 flex md:flex-col gap-1 overflow-x-auto scrollbar-thin pb-2 md:pb-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  activeTab === t.id
                    ? t.id === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-6">
            {activeTab === "profile" && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Profile</h3>
                <div>
                  <label className="text-xs text-muted-foreground">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-pill mt-1" maxLength={30} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bio <span className={bio.length > 110 ? "text-destructive" : ""}>{bio.length}/120</span></label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={120} className="w-full mt-1 rounded-lg bg-muted border-0 px-3 py-2 text-sm text-foreground resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status <span>{statusText.length}/40</span></label>
                  <Input value={statusText} onChange={(e) => setStatusText(e.target.value)} className="rounded-pill mt-1" maxLength={40} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Username</label>
                  <div className="relative mt-1">
                    <Input value={profile?.username || ""} disabled className="rounded-pill pr-8" />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <Button onClick={saveProfile} variant="hero" className="rounded-pill" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {activeTab === "password" && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Change Password</h3>
                {[
                  { label: "Current Password", value: currentPw, set: setCurrentPw, show: showCurrent, toggle: setShowCurrent },
                  { label: "New Password", value: newPw, set: setNewPw, show: showNew, toggle: setShowNew },
                  { label: "Confirm New Password", value: confirmPw, set: setConfirmPw, show: showConfirmPw, toggle: setShowConfirmPw },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs text-muted-foreground">{field.label}</label>
                    <div className="relative mt-1">
                      <Input
                        type={field.show ? "text" : "password"}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        className="rounded-pill pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => field.toggle(!field.show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {field.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                {newPw && confirmPw && (
                  <div className="flex items-center gap-1 text-xs">
                    {newPw === confirmPw ? (
                      <><Check className="h-3 w-3 text-bruchat-online" /> <span className="text-bruchat-online">Passwords match</span></>
                    ) : (
                      <><X className="h-3 w-3 text-destructive" /> <span className="text-destructive">Passwords don't match</span></>
                    )}
                  </div>
                )}
                <Button onClick={changePassword} variant="hero" className="rounded-pill">Save Password</Button>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Appearance</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Theme</span>
                  <div className="flex gap-2">
                    {["light", "dark"].map((t) => (
                      <button
                        key={t}
                        onClick={async () => {
                          setTheme(t);
                          if (t === "dark") {
                            document.documentElement.classList.add("dark");
                          } else {
                            document.documentElement.classList.remove("dark");
                          }
                          localStorage.setItem("bruchat-theme", t);
                          if (user) {
                            await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
                            await refreshProfile();
                          }
                          toast({ title: t === "dark" ? "Dark mode activated 🌙" : "Light mode activated ☀️" });
                        }}
                        className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${theme === t ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        {t === "light" ? "☀️ Light" : "🌙 Dark"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Font Size</span>
                  <div className="flex gap-2">
                    {["small", "medium", "large"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`px-3 py-1.5 rounded-pill text-xs ${fontSize === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Bubble Style</span>
                  <div className="flex gap-2">
                    {["rounded", "sharp", "minimal"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setBubbleStyle(s)}
                        className={`px-3 py-1.5 rounded-pill text-xs ${bubbleStyle === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={saveAppearance} variant="hero" className="rounded-pill">Save</Button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-2">
                <h3 className="font-heading font-semibold text-foreground mb-2">Notifications</h3>
                <PillToggle value={soundNotifs} onChange={setSoundNotifs} label="Sound notifications" />
                <PillToggle value={desktopNotifs} onChange={setDesktopNotifs} label="Desktop notifications" />
                <PillToggle value={showTyping} onChange={setShowTyping} label="Show typing indicators" />
                <PillToggle value={showReceipts} onChange={setShowReceipts} label="Show read receipts" />
                <Button onClick={saveNotifications} variant="hero" className="rounded-pill mt-4">Save</Button>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Privacy</h3>
                <PillToggle value={showOnline} onChange={setShowOnline} label="Show my online status" />
                <PillToggle value={showLastSeen} onChange={setShowLastSeenSetting} label="Show my last seen" />
                <Button onClick={savePrivacy} variant="hero" className="rounded-pill">Save</Button>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <Lock className="h-3 w-3" /> Your private messages are end-to-end encrypted 🔒
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Blocked Users</h4>
                  {blockedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">You haven't blocked anyone. Good vibes only 🙏</p>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="text-sm text-foreground flex-1">@{u.username}</span>
                          <Button size="sm" variant="outline" className="rounded-pill text-xs" onClick={() => unblockUser(u.id)}>
                            Unblock
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "starred" && (
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-4">Starred Messages</h3>
                <p className="text-sm text-muted-foreground">Coming soon ⭐</p>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-destructive">Danger Zone</h3>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm text-foreground font-medium">Delete My Account</p>
                    <p className="text-xs text-muted-foreground">This will permanently delete all your data. Type your username to confirm.</p>
                    <Input
                      value={deleteUsername}
                      onChange={(e) => setDeleteUsername(e.target.value)}
                      placeholder={`Type "${profile?.username}" to confirm`}
                      className="rounded-pill mt-2"
                    />
                    <Button
                      variant="destructive"
                      className="rounded-pill mt-2"
                      disabled={deleteUsername !== profile?.username}
                      onClick={deleteAccount}
                    >
                      Delete Account Permanently
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-pill w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    await signOut();
                    navigate("/login");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Log Out All Devices
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SettingsPage;
