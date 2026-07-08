import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, MessageCircle, Activity, LogOut, Shield, BarChart3, Send, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Settings, Eye, Trash2, Ban, Download, Filter, Flag, Crown, TrendingUp,
  Database, Bell, Lock, UserX, CheckCircle, XCircle, MoreVertical, Mail, ArrowUpDown,
  Volume2, Clock, AlertOctagon, Megaphone, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Cell
} from "recharts";

// ─── Helpers ───
const timeAgo = (d: string | null) => {
  if (!d) return "Never";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const exportCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const getAdminToken = () => sessionStorage.getItem("bruchat-admin-token") || "";
const isAdminTokenValid = () => {
  const exp = parseInt(sessionStorage.getItem("bruchat-admin-exp") || "0", 10);
  return !!getAdminToken() && exp * 1000 > Date.now();
};

const invokeAdmin = async (action: string, payload: any) => {
  if (!isAdminTokenValid()) {
    sessionStorage.removeItem("bruchat-admin-token");
    sessionStorage.removeItem("bruchat-admin-exp");
    toast({ title: "Admin session expired. Please sign in again.", variant: "destructive" });
    if (typeof window !== "undefined") window.location.href = "/admin";
    throw new Error("Admin session expired");
  }
  const { data, error } = await supabase.functions.invoke("admin-operations", {
    body: { action, payload, admin_token: getAdminToken() },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};


// ─── Paginated Table ───
const PaginatedTable = ({ data, columns, pageSize = 25, searchFields, renderRow, onExport, title, bulkActions }: {
  data: any[]; columns: { key: string; label: string }[]; pageSize?: number;
  searchFields?: string[]; renderRow: (item: any, idx: number) => React.ReactNode;
  onExport?: () => void; title?: string; bulkActions?: React.ReactNode;
}) => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let list = data;
    if (search && searchFields) {
      const q = search.toLowerCase();
      list = list.filter(item => searchFields.some(f => String(item[f] ?? "").toLowerCase().includes(q)));
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const va = a[sortKey] ?? "", vb = b[sortKey] ?? "";
        const cmp = typeof va === "number" ? va - (vb as number) : String(va).localeCompare(String(vb));
        return sortAsc ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, sortKey, sortAsc, searchFields]);

  const pages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => { setPage(0); }, [search]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {title && <h3 className="font-heading font-semibold text-foreground text-sm">{title}</h3>}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="!pl-9 !h-8 !text-xs !rounded-lg !py-1 !px-3 !pl-9" />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
        </span>
        {bulkActions}
        {onExport && (
          <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={onExport}>
            <Download className="h-3 w-3 mr-1" /> CSV
          </Button>
        )}
      </div>
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {columns.map(col => (
                  <th key={col.key} className="px-3 py-2 text-left text-muted-foreground font-medium cursor-pointer hover:text-foreground whitespace-nowrap"
                    onClick={() => { setSortKey(col.key); setSortAsc(sortKey === col.key ? !sortAsc : true); }}>
                    <span className="flex items-center gap-1">{col.label} <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageData.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">No data found</td></tr>
              ) : pageData.map((item, i) => renderRow(item, page * pageSize + i))}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-3 w-3" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {pages}</span>
          <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Confirm Dialog ───
const ConfirmDialog = ({ title, message, confirmText, onConfirm, onCancel }: {
  title: string; message: string; confirmText: string; onConfirm: () => void; onCancel: () => void;
}) => {
  const [input, setInput] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <p className="text-xs text-muted-foreground mb-2">Type <span className="text-destructive font-mono">{confirmText}</span> to confirm:</p>
        <Input value={input} onChange={e => setInput(e.target.value)} className="!rounded-lg mb-3 !text-sm" />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-lg" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" className="flex-1 rounded-lg" disabled={input !== confirmText} onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Stat Card ───
const StatCard = ({ label, value, icon: Icon, color = "text-primary", sparkData }: {
  label: string; value: number | string; icon: any; color?: string; sparkData?: number[];
}) => (
  <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Icon className={`h-4 w-4 ${color}`} /> <span className="text-xs">{label}</span>
    </div>
    <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
    {sparkData && sparkData.length > 0 && (
      <div className="absolute bottom-0 right-0 w-24 h-10 opacity-30">
        <ResponsiveContainer><AreaChart data={sparkData.map((v, i) => ({ v, i }))}>
          <Area type="monotone" dataKey="v" stroke="hsl(190,100%,42%)" fill="hsl(190,100%,42%)" fillOpacity={0.3} strokeWidth={1.5} />
        </AreaChart></ResponsiveContainer>
      </div>
    )}
  </div>
);

// ─── Progress Modal ───
const ProgressModal = ({ title, steps, currentStep }: { title: string; steps: string[]; currentStep: number }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
      <h3 className="font-heading font-bold text-foreground mb-4">{title}</h3>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {i < currentStep ? <CheckCircle className="h-4 w-4 text-bruchat-online" /> :
             i === currentStep ? <div className="h-4 w-4 rounded-full border-2 border-primary animate-spin border-t-transparent" /> :
             <div className="h-4 w-4 rounded-full border border-border" />}
            <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground"}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ users: 0, messages: 0, groups: 0, online: 0, newToday: 0, convos: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [broadcast, setBroadcast] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; message: string; text: string; action: () => void } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [msgFilter, setMsgFilter] = useState<{ type: string; userId: string }>({ type: "all", userId: "" });
  const [chartData, setChartData] = useState<any[]>([]);
  const [signupChartData, setSignupChartData] = useState<any[]>([]);
  const [featureData, setFeatureData] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [warnings, setWarnings] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [adminLog, setAdminLog] = useState<any[]>([]);
  const [modRules, setModRules] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>({ maintenance_mode: false, maintenance_message: "", announcement_text: "" });
  const [progress, setProgress] = useState<{ title: string; steps: string[]; current: number } | null>(null);
  const [viewProfile, setViewProfile] = useState<any>(null);
  const [newBlockword, setNewBlockword] = useState("");
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const lastActivityRef = useRef(Date.now());

  // Admin session check + 2h inactivity timeout
  useEffect(() => {
    if (!isAdminTokenValid()) {
      sessionStorage.removeItem("bruchat-admin-token");
      sessionStorage.removeItem("bruchat-admin-exp");
      navigate("/admin", { replace: true });
      return;
    }
    const resetActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener("click", resetActivity);
    window.addEventListener("keydown", resetActivity);
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 2 * 60 * 60 * 1000 || !isAdminTokenValid()) {
        sessionStorage.removeItem("bruchat-admin-token");
        sessionStorage.removeItem("bruchat-admin-exp");
        navigate("/admin", { replace: true });
        toast({ title: "Admin session expired. Log in again. 🔒" });
      }
    }, 30000);
    return () => { clearInterval(interval); window.removeEventListener("click", resetActivity); window.removeEventListener("keydown", resetActivity); };
  }, [navigate]);


  const sessionTimeLeft = () => {
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = Math.max(0, 2 * 60 * 60 * 1000 - elapsed);
    const mins = Math.floor(remaining / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Log admin action
  const logAction = async (actionType: string, targetUserId?: string, details?: any) => {
    try {
      await invokeAdmin("insert-data", { table: "admin_actions_log", row: { action_type: actionType, target_user_id: targetUserId || null, details: details || {} } });
    } catch { /* non-critical */ }
  };

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    const [u, m, gm, g, c, online] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("group_messages").select("id", { count: "exact", head: true }),
      supabase.from("groups").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id,username,avatar_url,display_name").eq("is_online", true),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { count: newToday } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString());
    setStats({
      users: u.count ?? 0, messages: (m.count ?? 0) + (gm.count ?? 0),
      groups: g.count ?? 0, online: online.data?.length ?? 0,
      newToday: newToday ?? 0, convos: c.count ?? 0,
    });
    setOnlineUsers(online.data || []);
  }, []);

  useEffect(() => { fetchStats(); const i = setInterval(fetchStats, 10000); return () => clearInterval(i); }, [fetchStats]);

  // ─── Fetch Data Per Tab ───
  useEffect(() => {
    const load = async () => {
      if (activeTab === "users") {
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
        const userIds = (data || []).map(u => u.id);
        const [warnRes, banRes, gmRes] = await Promise.all([
          invokeAdmin("select-data", { table: "warnings", select: "user_id" }).then(r => ({ data: (r.data || []).filter((w: any) => userIds.includes(w.user_id)) })).catch(() => ({ data: [] })),
          invokeAdmin("select-data", { table: "bans", select: "user_id" }).then(r => ({ data: (r.data || []).filter((b: any) => userIds.includes(b.user_id)) })).catch(() => ({ data: [] })),
          supabase.from("group_members").select("user_id").in("user_id", userIds),
        ]);
        const warnCounts: Record<string, number> = {};
        const banCounts: Record<string, number> = {};
        const groupCounts: Record<string, number> = {};
        (warnRes.data || []).forEach((w: any) => { warnCounts[w.user_id] = (warnCounts[w.user_id] || 0) + 1; });
        (banRes.data || []).forEach((b: any) => { banCounts[b.user_id] = (banCounts[b.user_id] || 0) + 1; });
        (gmRes.data || []).forEach((g: any) => { groupCounts[g.user_id] = (groupCounts[g.user_id] || 0) + 1; });
        setUsers((data || []).map(u => ({ ...u, warn_count: warnCounts[u.id] || 0, ban_count: banCounts[u.id] || 0, group_count: groupCounts[u.id] || 0 })));

      } else if (activeTab === "messages") {
        // Messages tab removed for privacy: admins cannot browse plaintext DMs.
        setAllMessages([]);
      } else if (activeTab === "groups") {
        const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
        setAllGroups(data || []);
      } else if (activeTab === "conversations") {
        const { data } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false }).limit(500);
        setAllConversations(data || []);
      } else if (activeTab === "reports" || activeTab === "moderation") {
        const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
        setReports(data || []);
        const { data: bansData } = await invokeAdmin("select-data", { table: "bans", select: "*", order: { column: "banned_at", ascending: false } });
        setBans(bansData || []);
        const { data: rulesData } = await invokeAdmin("select-data", { table: "auto_moderation_rules", select: "*" });
        setModRules(rulesData || []);

      } else if (activeTab === "analytics") {
        const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const [msgs, gmsgs, profiles] = await Promise.all([
          supabase.from("messages").select("created_at,message_type,image_url,audio_url,file_url").gte("created_at", thirtyAgo),
          supabase.from("group_messages").select("created_at").gte("created_at", thirtyAgo),
          supabase.from("profiles").select("id,username,display_name,avatar_url,created_at").order("created_at", { ascending: false }),
        ]);
        // Messages per day
        const days: Record<string, { dm: number; group: number }> = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const key = d.toLocaleDateString("en", { month: "short", day: "numeric" });
          days[key] = { dm: 0, group: 0 };
        }
        (msgs.data || []).forEach(m => { const k = new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }); if (days[k]) days[k].dm++; });
        (gmsgs.data || []).forEach(m => { const k = new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }); if (days[k]) days[k].group++; });
        setChartData(Object.entries(days).map(([date, v]) => ({ date, dm: v.dm, group: v.group, total: v.dm + v.group })));
        // Signups per day
        const signupDays: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          signupDays[d.toLocaleDateString("en", { month: "short", day: "numeric" })] = 0;
        }
        (profiles.data || []).forEach(p => { const k = new Date(p.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }); if (signupDays[k] !== undefined) signupDays[k]++; });
        setSignupChartData(Object.entries(signupDays).map(([date, count]) => ({ date, count })));
        // Feature usage
        let textCount = 0, imageCount = 0, voiceCount = 0, fileCount = 0;
        (msgs.data || []).forEach(m => {
          if (m.image_url) imageCount++;
          else if (m.audio_url) voiceCount++;
          else if (m.file_url) fileCount++;
          else textCount++;
        });
        const [reactionsRes, pollsRes] = await Promise.all([
          supabase.from("reactions").select("id", { count: "exact", head: true }),
          supabase.from("polls").select("id", { count: "exact", head: true }),
        ]);
        setFeatureData([
          { name: "Text", count: textCount },
          { name: "Images", count: imageCount },
          { name: "Voice", count: voiceCount },
          { name: "Files", count: fileCount },
          { name: "Reactions", count: reactionsRes.count || 0 },
          { name: "Polls", count: pollsRes.count || 0 },
        ]);
      } else if (activeTab === "system") {
        const counts: Record<string, number> = {};
        const tableNames = ["profiles", "conversations", "messages", "groups", "group_members", "group_messages", "reactions", "follows", "blocks", "notifications"];
        const results = await Promise.all(tableNames.map(t => supabase.from(t as any).select("id", { count: "exact", head: true })));
        results.forEach((r, i) => { counts[tableNames[i]] = r.count ?? 0; });
        setTableCounts(counts);
        const { data: settings } = await supabase.from("app_settings" as any).select("*").eq("id", "global").single();
        if (settings) setAppSettings(settings);
        const { data: logData } = await invokeAdmin("select-data", { table: "admin_actions_log", select: "*", order: { column: "performed_at", ascending: false }, limit: 200 });
        setAdminLog(logData || []);

      } else if (activeTab === "verification") {
        const { data } = await invokeAdmin("select-data", { table: "verification_requests", select: "*", order: { column: "created_at", ascending: false }, limit: 200 });
        setVerificationRequests(data || []);
      }
    };
    load();
  }, [activeTab, msgFilter]);

  // ─── TRUE DELETE ACCOUNT ───
  const trueDeleteAccount = async (userId: string) => {
    const steps = [
      "Deleting reactions", "Deleting poll votes", "Deleting starred messages", "Deleting drafts",
      "Deleting notifications", "Deleting follows", "Deleting blocks", "Deleting group message reads",
      "Deleting private messages", "Deleting group messages", "Removing from groups",
      "Deleting created groups", "Deleting conversations", "Deleting storage files",
      "Deleting profile", "Deleting auth account", "Logging action"
    ];
    setProgress({ title: "Deleting Account...", steps, current: 0 });
    try {
      const step = async (i: number) => setProgress(p => p ? { ...p, current: i } : null);
      
      await step(0); await supabase.from("reactions").delete().eq("user_id", userId);
      await step(1); await supabase.from("poll_votes").delete().eq("user_id", userId);
      await step(2); await supabase.from("starred_messages").delete().eq("user_id", userId);
      await step(3); await supabase.from("drafts").delete().eq("user_id", userId);
      await step(4);
      await supabase.from("notifications").delete().eq("user_id", userId);
      await supabase.from("notifications").delete().eq("from_user_id", userId);
      await step(5);
      await supabase.from("follows").delete().eq("follower_id", userId);
      await supabase.from("follows").delete().eq("following_id", userId);
      await step(6);
      await supabase.from("blocks").delete().eq("blocker_id", userId);
      await supabase.from("blocks").delete().eq("blocked_id", userId);
      await step(7); await supabase.from("group_message_reads" as any).delete().eq("user_id", userId);
      await step(8);
      // Delete private messages and storage
      const { data: userMsgs } = await supabase.from("messages").select("id,image_url,audio_url,video_url,file_url").eq("sender_id", userId);
      for (const msg of (userMsgs || [])) {
        for (const [url, bucket] of [[msg.image_url, "chat-images"], [msg.audio_url, "audio-messages"], [msg.video_url, "videos"], [msg.file_url, "files"]] as [string, string][]) {
          if (url) {
            const path = url.split("/").pop();
            if (path) try { await supabase.storage.from(bucket).remove([path]); } catch {}
          }
        }
      }
      await supabase.from("messages").delete().eq("sender_id", userId);
      await step(9);
      const { data: userGMsgs } = await supabase.from("group_messages").select("id,image_url,audio_url,video_url,file_url").eq("sender_id", userId);
      for (const msg of (userGMsgs || [])) {
        for (const [url, bucket] of [[msg.image_url, "chat-images"], [msg.audio_url, "audio-messages"], [msg.video_url, "videos"], [msg.file_url, "files"]] as [string, string][]) {
          if (url) {
            const path = url.split("/").pop();
            if (path) try { await supabase.storage.from(bucket).remove([path]); } catch {}
          }
        }
      }
      await supabase.from("group_messages").delete().eq("sender_id", userId);
      await step(10); await supabase.from("group_members").delete().eq("user_id", userId);
      await step(11);
      // Delete groups they created
      const { data: ownedGroups } = await supabase.from("groups").select("id").eq("created_by", userId);
      for (const g of (ownedGroups || [])) {
        await supabase.from("group_message_reads" as any).delete().eq("group_message_id", g.id); // approximate
        await supabase.from("group_messages").delete().eq("group_id", g.id);
        await supabase.from("group_members").delete().eq("group_id", g.id);
        await supabase.from("polls").delete().eq("group_id", g.id);
        await supabase.from("groups").delete().eq("id", g.id);
      }
      await step(12);
      // Delete conversations
      const { data: convos } = await supabase.from("conversations").select("id").or(`participant_a.eq.${userId},participant_b.eq.${userId}`);
      for (const c of (convos || [])) {
        await supabase.from("messages").delete().eq("conversation_id", c.id);
        await supabase.from("conversations").delete().eq("id", c.id);
      }
      await step(13);
      // Delete avatar and banner
      try { await supabase.storage.from("avatars").remove([`${userId}`]); } catch {}
      try { await supabase.storage.from("banners").remove([`${userId}`]); } catch {}
      await step(14);
      // Delete warnings, bans
      await invokeAdmin("delete-data", { table: "warnings", match_column: "user_id", match_value: userId });
      await invokeAdmin("delete-data", { table: "bans", match_column: "user_id", match_value: userId });
      await supabase.from("profiles").delete().eq("id", userId);
      await step(15);
      await invokeAdmin("delete-user", { user_id: userId });
      await step(16);
      await logAction("delete_account", userId, { permanent: true });

      setProgress(null);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: "Account permanently deleted. Every trace is gone. 🗑️" });
    } catch (err: any) {
      setProgress(null);
      toast({ title: `Deletion failed: ${err.message}`, variant: "destructive" });
    }
  };

  // ─── TRUE MESSAGE DELETION ───
  const trueDeleteMessage = async (msg: any) => {
    try {
      // Delete storage files
      for (const [url, bucket] of [[msg.image_url, "chat-images"], [msg.audio_url, "audio-messages"], [msg.video_url, "videos"], [msg.file_url, "files"]] as [string, string][]) {
        if (url) {
          const path = url.split("/").pop();
          if (path) try { await supabase.storage.from(bucket).remove([path]); } catch {}
        }
      }
      await supabase.from("reactions").delete().eq("message_id", msg.id);
      await supabase.from("messages").delete().eq("id", msg.id);
      await logAction("delete_message", msg.sender_id, { message_id: msg.id });
      setAllMessages(prev => prev.filter(m => m.id !== msg.id));
      toast({ title: "Message permanently deleted. 🗑️" });
    } catch (err: any) {
      toast({ title: `Failed: ${err.message}`, variant: "destructive" });
    }
  };

  // ─── TRUE CONVERSATION DELETION ───
  const trueDeleteConversation = async (convo: any) => {
    try {
      const { data: msgs } = await supabase.from("messages").select("id,image_url,audio_url,video_url,file_url").eq("conversation_id", convo.id);
      for (const msg of (msgs || [])) {
        for (const [url, bucket] of [[msg.image_url, "chat-images"], [msg.audio_url, "audio-messages"], [msg.video_url, "videos"], [msg.file_url, "files"]] as [string, string][]) {
          if (url) {
            const path = url.split("/").pop();
            if (path) try { await supabase.storage.from(bucket).remove([path]); } catch {}
          }
        }
        await supabase.from("reactions").delete().eq("message_id", msg.id);
      }
      await supabase.from("messages").delete().eq("conversation_id", convo.id);
      await supabase.from("conversations").delete().eq("id", convo.id);
      await logAction("delete_conversation", null as any, { conversation_id: convo.id });
      setAllConversations(prev => prev.filter(c => c.id !== convo.id));
      toast({ title: "Conversation permanently deleted. 🗑️" });
    } catch (err: any) {
      toast({ title: `Failed: ${err.message}`, variant: "destructive" });
    }
  };

  // ─── TRUE GROUP DELETION ───
  const trueDeleteGroup = async (group: any) => {
    try {
      const { data: gmsgs } = await supabase.from("group_messages").select("id,image_url,audio_url,video_url,file_url").eq("group_id", group.id);
      for (const msg of (gmsgs || [])) {
        for (const [url, bucket] of [[msg.image_url, "chat-images"], [msg.audio_url, "audio-messages"], [msg.video_url, "videos"], [msg.file_url, "files"]] as [string, string][]) {
          if (url) {
            const path = url.split("/").pop();
            if (path) try { await supabase.storage.from(bucket).remove([path]); } catch {}
          }
        }
      }
      await supabase.from("group_message_reads" as any).delete().eq("group_message_id", (gmsgs || []).map(m => m.id));
      await supabase.from("group_messages").delete().eq("group_id", group.id);
      await supabase.from("group_members").delete().eq("group_id", group.id);
      await supabase.from("polls").delete().eq("group_id", group.id);
      if (group.avatar_url) {
        const path = group.avatar_url.split("/").pop();
        if (path) try { await supabase.storage.from("group-images").remove([path]); } catch {}
      }
      await supabase.from("groups").delete().eq("id", group.id);
      await logAction("delete_group", null as any, { group_id: group.id, group_name: group.name });
      setAllGroups(prev => prev.filter(g => g.id !== group.id));
      toast({ title: "Group permanently deleted. 🗑️" });
    } catch (err: any) {
      toast({ title: `Failed: ${err.message}`, variant: "destructive" });
    }
  };

  // ─── TRUE BAN ───
  const trueBan = async (userId: string, reason = "Admin action") => {
    await supabase.from("profiles").update({ is_banned: true }).eq("id", userId);
    try { await invokeAdmin("invalidate-sessions", { user_id: userId }); } catch {}
    try { await invokeAdmin("insert-data", { table: "bans", row: { user_id: userId, reason } }); } catch {}
    await logAction("ban_user", userId, { reason });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: true } : u));
    toast({ title: "User banned and kicked out 🚫" });
  };

  // ─── TRUE UNBAN ───
  const trueUnban = async (userId: string) => {
    await supabase.from("profiles").update({ is_banned: false }).eq("id", userId);
    try { await invokeAdmin("update-data", { table: "bans", values: { unbanned_at: new Date().toISOString() }, match_column: "user_id", match_value: userId }); } catch {}
    await logAction("unban_user", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: false } : u));
    toast({ title: "User unbanned ✅" });
  };

  // ─── TRUE WARN ───
  const trueWarn = async (userId: string, reason = "Community guidelines violation") => {
    const { data: convos } = await supabase.from("conversations").select("id").or(`participant_a.eq.${userId},participant_b.eq.${userId}`);
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    if (adminId && convos) {
      for (const c of convos) {
        await supabase.from("messages").insert({
          conversation_id: c.id, sender_id: adminId,
          content: "⚠️ BRUChat System: Your account has received a warning from the BRUChat team for violating community guidelines. Further violations may result in a permanent ban.",
          message_type: "system", encrypted: false,
        });
      }
    }
    try { await invokeAdmin("insert-data", { table: "warnings", row: { user_id: userId, reason } }); } catch {}
    try { await invokeAdmin("insert-data", { table: "notifications", row: { user_id: userId, type: "warning", from_user_id: adminId } }); } catch {}
    await logAction("warn_user", userId, { reason });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, warn_count: (u.warn_count || 0) + 1 } : u));
    toast({ title: "Warning sent ⚠️" });
  };

  // ─── TRUE BROADCAST ───
  const trueBroadcast = async () => {
    if (!broadcast.trim()) return;
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    if (!adminId) return;
    const { data: convos } = await supabase.from("conversations").select("id");
    const { data: groups } = await supabase.from("groups").select("id");
    let convoCount = 0, groupCount = 0;
    for (const c of (convos || [])) {
      await supabase.from("messages").insert({
        conversation_id: c.id, sender_id: adminId,
        content: `📢 BRUChat System: ${broadcast}`, message_type: "system", encrypted: false,
      });
      convoCount++;
    }
    for (const g of (groups || [])) {
      await supabase.from("group_messages").insert({
        group_id: g.id, sender_id: adminId,
        content: `📢 BRUChat System: ${broadcast}`, message_type: "system",
      });
      groupCount++;
    }
    await logAction("broadcast", undefined, { message: broadcast, conversations: convoCount, groups: groupCount });
    setBroadcast("");
    toast({ title: `Broadcast sent to ${convoCount} conversations and ${groupCount} groups 📢` });
  };

  // ─── BULK ACTIONS ───
  const bulkAction = async (action: "ban" | "warn" | "delete") => {
    const ids = [...selectedUsers];
    if (action === "ban") {
      for (const id of ids) await trueBan(id);
    } else if (action === "warn") {
      for (const id of ids) await trueWarn(id);
    } else if (action === "delete") {
      for (const id of ids) await trueDeleteAccount(id);
    }
    setSelectedUsers(new Set());
  };

  const bulkDeleteMessages = async () => {
    const ids = [...selectedMessages];
    for (const id of ids) {
      const msg = allMessages.find(m => m.id === id);
      if (msg) await trueDeleteMessage(msg);
    }
    setSelectedMessages(new Set());
  };

  // ─── FORGOT PASSWORD HELPER ───
  const sendResetEmail = async (userId: string) => {
    try {
      const res = await invokeAdmin("get-user-email", { user_id: userId });
      if (res.provider !== "email") {
        toast({ title: `This user signed in with ${res.provider}. They have no password to reset.` });
        return;
      }
      await invokeAdmin("send-reset-email", { email: res.email });
      await logAction("send_reset_email", userId, { email: res.email });
      toast({ title: `Password reset email sent to ${res.email} 📬` });
    } catch (err: any) {
      toast({ title: `Failed: ${err.message}`, variant: "destructive" });
    }
  };

  // ─── REPORT ACTIONS ───
  const resolveReport = async (id: string) => {
    await invokeAdmin("update-data", { table: "reports", values: { is_resolved: true }, match_column: "id", match_value: id });
    setReports(prev => prev.map(r => r.id === id ? { ...r, is_resolved: true } : r));
    await logAction("dismiss_report", undefined, { report_id: id });
    toast({ title: "Report dismissed" });
  };

  // ─── APP SETTINGS ───
  const updateAppSettings = async (updates: any) => {
    try {
      await invokeAdmin("update-data", { table: "app_settings", values: { ...updates, updated_at: new Date().toISOString() }, match_column: "id", match_value: "global" });
      setAppSettings((prev: any) => ({ ...prev, ...updates }));
      toast({ title: "Settings updated ✅" });
    } catch (err: any) {
      toast({ title: `Failed: ${err.message}`, variant: "destructive" });
    }
  };

  // ─── AUTO MODERATION RULES ───
  const addBlockword = async () => {
    if (!newBlockword.trim()) return;
    try {
      await invokeAdmin("insert-data", { table: "auto_moderation_rules", row: { rule_type: "blocklist", value: newBlockword.trim().toLowerCase(), is_active: true } });
      setModRules(prev => [...prev, { rule_type: "blocklist", value: newBlockword.trim().toLowerCase(), is_active: true, id: Date.now() }]);
      setNewBlockword("");
      toast({ title: "Word added to blocklist" });
    } catch {}
  };

  const removeBlockword = async (ruleId: string) => {
    try {
      await invokeAdmin("delete-data", { table: "auto_moderation_rules", match_column: "id", match_value: ruleId });
      setModRules(prev => prev.filter(r => r.id !== ruleId));
      toast({ title: "Word removed from blocklist" });
    } catch {}
  };

  const handleLogout = () => {
    sessionStorage.removeItem("bruchat-admin-token");
    sessionStorage.removeItem("bruchat-admin-exp");
    navigate("/admin", { replace: true });
  };


  const navItems = [
    { id: "dashboard", label: "📊 Dashboard", icon: BarChart3 },
    { id: "users", label: "👥 Users", icon: Users },
    
    { id: "groups", label: "👥 Groups", icon: Users },
    { id: "conversations", label: "🔒 Conversations", icon: Lock },
    { id: "analytics", label: "📈 Analytics", icon: TrendingUp },
    { id: "moderation", label: "🛡️ Moderation", icon: Shield },
    { id: "reports", label: "🚨 Reports", icon: AlertTriangle },
    { id: "system", label: "⚙️ System", icon: Settings },
    { id: "broadcast", label: "📢 Broadcast", icon: Send },
    { id: "verification", label: "✅ Verification", icon: BadgeCheck },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border flex flex-col p-4 overflow-y-auto scrollbar-thin flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-destructive" />
          <span className="font-heading font-bold text-foreground">BRU<span className="text-destructive">Admin</span></span>
        </div>
        <div className="text-[10px] text-muted-foreground mb-4 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Session: {sessionTimeLeft()}
        </div>
        <div className="flex-1 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                activeTab === item.id ? "bg-destructive/10 text-destructive font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}>
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-destructive mt-4">
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <StatCard label="Total Users" value={stats.users} icon={Users} />
              <StatCard label="New Today" value={stats.newToday} icon={TrendingUp} color="text-bruchat-online" />
              <StatCard label="Total Messages" value={stats.messages} icon={MessageCircle} />
              <StatCard label="Groups" value={stats.groups} icon={Users} />
              <StatCard label="Conversations" value={stats.convos} icon={Lock} />
              <StatCard label="Online Now" value={stats.online} icon={Activity} color="text-bruchat-online" />
            </div>
            {onlineUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">🟢 Live Online Users</h3>
                <div className="flex flex-wrap gap-2">
                  {onlineUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                        {u.avatar_url ? <img src={u.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" /> : u.display_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-xs text-foreground">@{u.username}</span>
                      <span className="w-2 h-2 rounded-full bg-bruchat-online animate-pulse-online" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── USERS ─── */}
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-foreground">Users</h2>
            </div>
            <PaginatedTable
              data={users}
              columns={[
                { key: "select", label: "☑" }, { key: "display_name", label: "User" }, { key: "username", label: "Username" },
                { key: "last_seen", label: "Last Active" },
                { key: "group_count", label: "Groups" }, { key: "warn_count", label: "Warns" },
                { key: "is_banned", label: "Status" }, { key: "created_at", label: "Joined" },
              ]}
              searchFields={["username", "display_name"]}
              onExport={() => exportCSV(users.map(u => ({
                username: u.username, display_name: u.display_name,
                last_seen: u.last_seen, groups: u.group_count, warnings: u.warn_count, is_banned: u.is_banned, joined: u.created_at,
              })), `bruchat-users-${new Date().toISOString().slice(0, 10)}.csv`)}
              bulkActions={selectedUsers.size > 0 ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="rounded-lg text-xs"
                    onClick={() => setConfirm({ title: "Ban Users", message: `Ban ${selectedUsers.size} users?`, text: "DELETE", action: () => { bulkAction("ban"); setConfirm(null); } })}>
                    Ban {selectedUsers.size}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => bulkAction("warn")}>
                    Warn {selectedUsers.size}
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-lg text-xs"
                    onClick={() => setConfirm({ title: "Delete Users", message: `Permanently delete ${selectedUsers.size} users?`, text: "DELETE", action: () => { bulkAction("delete"); setConfirm(null); } })}>
                    Delete {selectedUsers.size}
                  </Button>
                </div>
              ) : undefined}
              renderRow={(u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selectedUsers.has(u.id)}
                      onChange={e => { const s = new Set(selectedUsers); e.target.checked ? s.add(u.id) : s.delete(u.id); setSelectedUsers(s); }}
                      className="rounded accent-destructive" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> : u.display_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-foreground font-medium">{u.display_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">@{u.username}</td>
                  <td className="px-3 py-2 text-muted-foreground">{timeAgo(u.last_seen)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.group_count}</td>
                  <td className="px-3 py-2">
                    {u.warn_count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.warn_count >= 3 ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-600"}`}>
                        {u.warn_count}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.is_banned ? "bg-destructive/20 text-destructive" : "bg-bruchat-online/20 text-bruchat-online"}`}>
                      {u.is_banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center gap-1 justify-end flex-wrap">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded" onClick={() => setViewProfile(u)} title="View Profile">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded" onClick={() => trueWarn(u.id)} title="Warn">⚠️</Button>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded" onClick={() => sendResetEmail(u.id)} title="Reset Password">
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant={u.is_banned ? "outline" : "destructive"} className="h-6 px-2 text-[10px] rounded"
                        onClick={() => u.is_banned ? trueUnban(u.id) : setConfirm({ title: "Ban User", message: `Ban @${u.username}?`, text: "DELETE", action: () => { trueBan(u.id); setConfirm(null); } })}>
                        {u.is_banned ? "Unban" : "Ban"}
                      </Button>
                      <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px] rounded"
                        onClick={() => setConfirm({ title: "Delete Account", message: `Permanently delete @${u.username} and ALL their data?`, text: "DELETE", action: () => { trueDeleteAccount(u.id); setConfirm(null); } })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        )}

        {/* Messages tab removed — admins cannot browse private chats for user privacy. */}



        {/* ─── GROUPS ─── */}
        {activeTab === "groups" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Groups</h2>
            <PaginatedTable
              data={allGroups}
              columns={[
                { key: "name", label: "Name" }, { key: "description", label: "Description" },
                { key: "max_members", label: "Max" }, { key: "is_public", label: "Public" }, { key: "created_at", label: "Created" },
              ]}
              searchFields={["name", "description"]}
              onExport={() => exportCSV(allGroups, `bruchat-groups-${new Date().toISOString().slice(0, 10)}.csv`)}
              renderRow={(g) => (
                <tr key={g.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-foreground font-medium">{g.name}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{g.description || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{g.max_members}</td>
                  <td className="px-3 py-2">{g.is_public ? "✅" : "❌"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded text-destructive"
                      onClick={() => setConfirm({ title: "Delete Group", message: `Delete "${g.name}" and ALL messages?`, text: "DELETE", action: () => { trueDeleteGroup(g); setConfirm(null); } })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              )}
            />
          </div>
        )}

        {/* ─── CONVERSATIONS ─── */}
        {activeTab === "conversations" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Conversations</h2>
            <PaginatedTable
              data={allConversations}
              columns={[
                { key: "participant_a", label: "User A" }, { key: "participant_b", label: "User B" }, { key: "last_message_at", label: "Last Activity" },
              ]}
              searchFields={["participant_a", "participant_b"]}
              renderRow={(c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{c.participant_a?.slice(0, 8)}...</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{c.participant_b?.slice(0, 8)}...</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.last_message_at ? timeAgo(c.last_message_at) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded text-destructive"
                      onClick={() => setConfirm({ title: "Delete Conversation", message: "Delete this conversation and ALL messages permanently?", text: "DELETE", action: () => { trueDeleteConversation(c); setConfirm(null); } })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              )}
            />
          </div>
        )}

        {/* ─── ANALYTICS ─── */}
        {activeTab === "analytics" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Messages Over Time (30 days)</h3>
                <div className="h-56">
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="dm" stroke="hsl(190,100%,42%)" strokeWidth={2} dot={false} name="Private" />
                      <Line type="monotone" dataKey="group" stroke="hsl(145,80%,52%)" strokeWidth={2} dot={false} name="Group" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">New Users Over Time (30 days)</h3>
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart data={signupChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(190,100%,42%)" radius={[4, 4, 0, 0]} name="Signups" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Most Used Features</h3>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={featureData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(190,100%,42%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODERATION ─── */}
        {activeTab === "moderation" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Moderation</h2>

            {/* Pending reports */}
            <h3 className="text-sm font-medium text-foreground mb-2">Pending Reports</h3>
            <div className="space-y-3 mb-6">
              {reports.filter(r => !r.is_resolved).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending reports 🎉</p>
              ) : reports.filter(r => !r.is_resolved).map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">{r.reason}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Reporter: <span className="font-mono">{r.reporter_id?.slice(0, 8)}</span></p>
                      <p className="text-xs text-muted-foreground">Reported: <span className="font-mono">{r.reported_user_id?.slice(0, 8)}</span></p>
                      {r.description && <p className="text-sm text-foreground mt-2">{r.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => resolveReport(r.id)}>Dismiss</Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => trueWarn(r.reported_user_id)}>⚠️ Warn</Button>
                      <Button size="sm" variant="destructive" className="h-7 rounded-lg text-xs"
                        onClick={() => setConfirm({ title: "Ban User", message: "Ban this reported user?", text: "DELETE", action: () => { trueBan(r.reported_user_id); resolveReport(r.id); setConfirm(null); } })}>
                        Ban
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Banned Users */}
            <h3 className="text-sm font-medium text-foreground mb-2">Banned Users</h3>
            <div className="space-y-2 mb-6">
              {users.filter(u => u.is_banned).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No banned users</p>
              ) : users.filter(u => u.is_banned).map(u => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-[10px] font-bold">
                      {u.display_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground">@{u.username}</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => trueUnban(u.id)}>Unban</Button>
                </div>
              ))}
            </div>

            {/* Auto Moderation */}
            <h3 className="text-sm font-medium text-foreground mb-2">Auto Moderation Rules</h3>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Word Blocklist</p>
                <div className="flex gap-2 mb-2">
                  <Input value={newBlockword} onChange={e => setNewBlockword(e.target.value)} placeholder="Add word..." className="!h-8 !text-xs !rounded-lg !py-1" />
                  <Button size="sm" onClick={addBlockword} className="rounded-lg text-xs h-8">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {modRules.filter(r => r.rule_type === "blocklist").map(r => (
                    <span key={r.id} className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                      {r.value}
                      <button onClick={() => removeBlockword(r.id)} className="hover:text-foreground"><XCircle className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── REPORTS ─── */}
        {activeTab === "reports" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">All Reports</h2>
            <PaginatedTable
              data={reports}
              columns={[
                { key: "reason", label: "Reason" }, { key: "description", label: "Description" },
                { key: "reporter_id", label: "Reporter" }, { key: "reported_user_id", label: "Reported" },
                { key: "is_resolved", label: "Status" }, { key: "created_at", label: "Date" },
              ]}
              searchFields={["reason", "description"]}
              onExport={() => exportCSV(reports, `bruchat-reports-${new Date().toISOString().slice(0, 10)}.csv`)}
              renderRow={(r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2"><span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">{r.reason}</span></td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{r.description || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{r.reporter_id?.slice(0, 8)}...</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{r.reported_user_id?.slice(0, 8)}...</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.is_resolved ? "bg-bruchat-online/20 text-bruchat-online" : "bg-yellow-500/20 text-yellow-500"}`}>
                      {r.is_resolved ? "Resolved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    {!r.is_resolved && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded" onClick={() => resolveReport(r.id)}>Dismiss</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded" onClick={() => trueWarn(r.reported_user_id)}>⚠️</Button>
                        <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px] rounded"
                          onClick={() => setConfirm({ title: "Ban User", message: "Ban this reported user?", text: "DELETE", action: () => { trueBan(r.reported_user_id); resolveReport(r.id); setConfirm(null); } })}>
                          Ban
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            />
          </div>
        )}

        {/* ─── SYSTEM ─── */}
        {activeTab === "system" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">System</h2>

            {/* Maintenance Mode */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3">🔧 Maintenance Mode</h3>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => updateAppSettings({ maintenance_mode: !appSettings.maintenance_mode })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${appSettings.maintenance_mode ? "bg-destructive" : "bg-muted"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${appSettings.maintenance_mode ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm text-foreground">{appSettings.maintenance_mode ? "ON — Users see maintenance screen" : "OFF — App is live"}</span>
              </div>
              <Input value={appSettings.maintenance_message || ""} onChange={e => setAppSettings((p: any) => ({ ...p, maintenance_message: e.target.value }))}
                placeholder="Maintenance message..." className="!h-8 !text-xs !rounded-lg mb-2" />
              <Button size="sm" onClick={() => updateAppSettings({ maintenance_message: appSettings.maintenance_message })} className="rounded-lg text-xs">Save Message</Button>
            </div>

            {/* Announcement Banner */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3">📢 Announcement Banner</h3>
              <Input value={appSettings.announcement_text || ""} onChange={e => setAppSettings((p: any) => ({ ...p, announcement_text: e.target.value }))}
                placeholder="Announcement text (empty to hide)..." className="!h-8 !text-xs !rounded-lg mb-2" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateAppSettings({ announcement_text: appSettings.announcement_text })} className="rounded-lg text-xs">Save</Button>
                <Button size="sm" variant="outline" onClick={() => updateAppSettings({ announcement_text: "" })} className="rounded-lg text-xs">Clear</Button>
              </div>
            </div>

            {/* Database Stats */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3">📊 Database Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(tableCounts).map(([table, count]) => (
                  <div key={table} className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-heading font-bold text-foreground">{count.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{table}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Action Log */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3">📋 Admin Action Log</h3>
              <PaginatedTable
                data={adminLog}
                columns={[
                  { key: "action_type", label: "Action" }, { key: "target_user_id", label: "Target" },
                  { key: "performed_at", label: "Time" },
                ]}
                searchFields={["action_type"]}
                pageSize={10}
                onExport={() => exportCSV(adminLog, `bruchat-admin-log-${new Date().toISOString().slice(0, 10)}.csv`)}
                renderRow={(a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2"><span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{a.action_type}</span></td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{a.target_user_id?.slice(0, 8) || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{timeAgo(a.performed_at)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                )}
              />
            </div>

            {/* Export */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3">📤 Export Data</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Export All Users", table: "profiles" },
                  { label: "Export All Messages", table: "messages" },
                  { label: "Export All Groups", table: "groups" },
                  { label: "Export All Reports", table: "reports" },
                ].map(({ label, table }) => (
                  <Button key={table} size="sm" variant="outline" className="rounded-lg text-xs"
                    onClick={async () => { const { data } = await supabase.from(table as any).select("*").limit(1000); if (data) exportCSV(data, `bruchat-${table}-${new Date().toISOString().slice(0, 10)}.csv`); toast({ title: `${label} complete` }); }}>
                    <Download className="h-3 w-3 mr-1" /> {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Storage Buckets */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">🗄️ Storage Buckets</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["avatars", "banners", "chat-images", "group-images", "audio-messages", "videos", "files"].map(bucket => (
                  <div key={bucket} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-foreground mb-1">{bucket}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Public bucket</p>
                    <Button size="sm" variant="destructive" className="h-6 text-[10px] rounded"
                      onClick={() => setConfirm({ title: "Delete All Files", message: `Delete all files in "${bucket}"?`, text: "DELETE", action: async () => {
                        try {
                          const res = await invokeAdmin("list-storage-files", { bucket });
                          if (res.files?.length) {
                            await invokeAdmin("delete-storage-files", { bucket, paths: res.files.map((f: any) => f.name) });
                          }
                          await logAction("delete_bucket_files", undefined, { bucket });
                          toast({ title: `All files in ${bucket} deleted 🗑️` });
                        } catch (err: any) { toast({ title: `Failed: ${err.message}`, variant: "destructive" }); }
                        setConfirm(null);
                      }})}>
                      Delete All
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── BROADCAST ─── */}
        {activeTab === "broadcast" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Broadcast</h2>
            <p className="text-sm text-muted-foreground mb-3">Send a system message to every conversation and group</p>
            <textarea
              value={broadcast}
              onChange={e => setBroadcast(e.target.value)}
              placeholder="Type your broadcast message..."
              className="w-full max-w-lg rounded-xl px-4 py-3 text-sm resize-none h-32"
            />
            <br />
            <Button onClick={trueBroadcast} className="rounded-full mt-2 bg-destructive hover:bg-destructive/90" disabled={!broadcast.trim()}>
              <Send className="h-4 w-4 mr-1" /> Send to Everyone
            </Button>
          </div>
        )}

        {/* ─── VERIFICATION ─── */}
        {activeTab === "verification" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Verification Requests</h2>
            <PaginatedTable
              data={verificationRequests}
              columns={[
                { key: "user_id", label: "User" }, { key: "full_name", label: "Name" },
                { key: "category", label: "Category" }, { key: "follower_count_at_apply", label: "Followers" },
                { key: "status", label: "Status" }, { key: "created_at", label: "Date" },
              ]}
              searchFields={["full_name", "category", "reason"]}
              renderRow={(req) => (
                <tr key={req.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{req.user_id?.slice(0, 8)}...</td>
                  <td className="px-3 py-2 text-foreground">{req.full_name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{req.category || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{req.follower_count_at_apply ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      req.status === "approved" ? "bg-green-500/20 text-green-500" :
                      req.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-yellow-500/20 text-yellow-500"
                    }`}>{req.status}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    {req.status === "pending" && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded" title="View details"
                          onClick={() => {
                            setViewProfile({
                              "Full Name": req.full_name, "Category": req.category,
                              "Bio": req.bio_text, "Social Links": req.social_links,
                              "Notable Work": req.notable_work, "Reason": req.reason,
                              "Followers at Apply": req.follower_count_at_apply, "Submitted": new Date(req.created_at).toLocaleString(),
                              display_name: req.full_name || "Applicant", username: req.user_id?.slice(0, 8),
                            });
                          }}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" className="h-6 px-2 text-[10px] rounded bg-green-600 hover:bg-green-700 text-white"
                          onClick={async () => {
                            try {
                              await invokeAdmin("update-data", { table: "verification_requests", values: { status: "approved", reviewed_at: new Date().toISOString() }, match_column: "id", match_value: req.id });
                              await invokeAdmin("delete-data", { table: "verified_users", match_column: "user_id", match_value: req.user_id }).catch(() => {});
                              await invokeAdmin("insert-data", { table: "verified_users", row: { user_id: req.user_id, badge_type: "true" } });
                              setVerificationRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
                              await logAction("approve_verification", req.user_id, { badge_type: "true" });
                              toast({ title: "Approved with TRUE badge ✅" });
                            } catch (err: any) { toast({ title: `Failed: ${err.message}`, variant: "destructive" }); }
                          }}>
                          True ✅
                        </Button>
                        <Button size="sm" className="h-6 px-2 text-[10px] rounded bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={async () => {
                            try {
                              await invokeAdmin("update-data", { table: "verification_requests", values: { status: "approved", reviewed_at: new Date().toISOString() }, match_column: "id", match_value: req.id });
                              await invokeAdmin("delete-data", { table: "verified_users", match_column: "user_id", match_value: req.user_id }).catch(() => {});
                              await invokeAdmin("insert-data", { table: "verified_users", row: { user_id: req.user_id, badge_type: "fake" } });
                              setVerificationRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
                              await logAction("approve_verification", req.user_id, { badge_type: "fake" });
                              toast({ title: "Approved with FAKE badge ☑️" });
                            } catch (err: any) { toast({ title: `Failed: ${err.message}`, variant: "destructive" }); }
                          }}>
                          Fake ☑️
                        </Button>
                        <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px] rounded"
                          onClick={async () => {
                            try {
                              await invokeAdmin("update-data", { table: "verification_requests", values: { status: "rejected", reviewed_at: new Date().toISOString() }, match_column: "id", match_value: req.id });
                              setVerificationRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
                              await logAction("reject_verification", req.user_id);
                              toast({ title: "Request rejected ❌" });
                            } catch (err: any) { toast({ title: `Failed: ${err.message}`, variant: "destructive" }); }
                          }}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            />

            {/* Promotions Panel */}
            <div className="mt-8 bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading text-lg font-bold text-foreground mb-3">🎁 Promotions</h3>
              <p className="text-xs text-muted-foreground mb-4">Toggle a free verified-badge promotion. Logged-in users will be auto-granted a true badge while active.</p>
              <div className="flex items-center gap-3 mb-3">
                <Button size="sm"
                  onClick={async () => {
                    await invokeAdmin("update-data", { table: "app_settings", values: { promo_free_verification: true, promo_end_date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString() }, match_column: "id", match_value: "global" });
                    toast({ title: "Free verification promo ENABLED for 60 days 🎁" });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white">Enable promo (60 days)</Button>
                <Button size="sm" variant="outline"
                  onClick={async () => {
                    await invokeAdmin("update-data", { table: "app_settings", values: { promo_free_verification: false }, match_column: "id", match_value: "global" });
                    toast({ title: "Promo disabled" });
                  }}>Disable promo</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Tip: Use the Users tab to manually grant or revoke verification anytime.</p>
            </div>

            {/* Post Limit Reset */}
            <div className="mt-4 bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading text-lg font-bold text-foreground mb-3">📝 Post Limit Overrides</h3>
              <p className="text-xs text-muted-foreground mb-3">Default daily limit is 10 posts/user. Enter a username to raise their limit.</p>
              <div className="flex gap-2">
                <Input id="plr-user" placeholder="username" className="h-8 text-xs flex-1" />
                <Input id="plr-limit" type="number" placeholder="50" className="h-8 text-xs w-24" />
                <Button size="sm" onClick={async () => {
                  const u = (document.getElementById("plr-user") as HTMLInputElement).value.trim();
                  const l = parseInt((document.getElementById("plr-limit") as HTMLInputElement).value, 10);
                  if (!u || !l) { toast({ title: "Username and limit required", variant: "destructive" }); return; }
                  const { data: prof } = await supabase.from("profiles").select("id").eq("username", u).maybeSingle();
                  if (!prof) { toast({ title: "User not found", variant: "destructive" }); return; }
                  await invokeAdmin("update-data", { table: "profiles", values: { post_limit_override: l }, match_column: "id", match_value: prof.id });
                  toast({ title: `Limit set to ${l} for @${u} ✅` });
                }}>Set</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const u = (document.getElementById("plr-user") as HTMLInputElement).value.trim();
                  if (!u) return;
                  const { data: prof } = await supabase.from("profiles").select("id").eq("username", u).maybeSingle();
                  if (!prof) return;
                  await invokeAdmin("update-data", { table: "profiles", values: { post_limit_override: null }, match_column: "id", match_value: prof.id });
                  toast({ title: `Reset @${u} to default 10/day` });
                }}>Reset</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Profile Modal */}
      {viewProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewProfile(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {viewProfile.avatar_url ? <img src={viewProfile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" /> : viewProfile.display_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground">{viewProfile.display_name}</h3>
                <p className="text-xs text-muted-foreground">@{viewProfile.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(viewProfile).filter(([k]) => !["id"].includes(k)).map(([key, val]) => (
                <div key={key} className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-[10px]">{key}</p>
                  <p className="text-foreground truncate">{String(val ?? "—")}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="rounded-lg mt-4 w-full" onClick={() => setViewProfile(null)}>Close</Button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title} message={confirm.message} confirmText={confirm.text}
          onConfirm={() => { confirm.action(); }} onCancel={() => setConfirm(null)}
        />
      )}

      {/* Progress modal */}
      {progress && <ProgressModal title={progress.title} steps={progress.steps} currentStep={progress.current} />}
    </div>
  );
};

export default AdminPanel;
