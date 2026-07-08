import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAdminToken } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables this endpoint is allowed to read/write. Locks down the generic
// select-data/insert-data/update-data/delete-data actions.
const ALLOWED_TABLES = new Set([
  "admin_actions_log",
  "app_settings",
  "auto_moderation_rules",
  "bans",
  "verified_users",
  "warnings",
  "verification_requests",
  
  "achievements",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload, admin_token } = body ?? {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Actions callable by any authenticated user (must operate on their own row).
    const USER_ACTIONS = new Set(["grant-achievement"]);

    let callerUserId: string | null = null;
    if (USER_ACTIONS.has(action)) {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (!jwt) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
      const { data: claims, error: claimsErr } = await userClient.auth.getClaims(jwt);
      if (claimsErr || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      callerUserId = claims.claims.sub as string;
      if (payload?.user_id && payload.user_id !== callerUserId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      if (!(await verifyAdminToken(admin_token))) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (["select-data", "insert-data", "update-data", "delete-data"].includes(action)) {
        if (!ALLOWED_TABLES.has(payload?.table)) {
          return new Response(JSON.stringify({ error: "Table not allowed" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);


    switch (action) {
      case "delete-user": {
        const { error } = await supabase.auth.admin.deleteUser(payload.user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "invalidate-sessions": {
        const { error } = await supabase.auth.admin.signOut(payload.user_id, "global");
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "send-reset-email": {
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: payload.email,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, link: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list-storage-files": {
        const { data, error } = await supabase.storage.from(payload.bucket).list("", { limit: 1000 });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, files: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete-storage-files": {
        const { data, error } = await supabase.storage.from(payload.bucket).remove(payload.paths);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "get-user-email": {
        const { data, error } = await supabase.auth.admin.getUserById(payload.user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ 
          success: true, 
          email: data.user.email,
          provider: data.user.app_metadata?.provider || "email"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "insert-data": {
        const { data, error } = await supabase.from(payload.table).insert(payload.row);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update-data": {
        const q = supabase.from(payload.table).update(payload.values);
        const { data, error } = await q.eq(payload.match_column, payload.match_value);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete-data": {
        const q = supabase.from(payload.table).delete();
        const { error } = await q.eq(payload.match_column, payload.match_value);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "select-data": {
        let q = supabase.from(payload.table).select(payload.select || "*");
        if (payload.match_column && payload.match_value) {
          q = q.eq(payload.match_column, payload.match_value);
        }
        if (payload.order) {
          q = q.order(payload.order.column, { ascending: payload.order.ascending ?? false });
        }
        if (payload.limit) {
          q = q.limit(payload.limit);
        }
        const { data, error } = await q;
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }


      case "grant-achievement": {
        const type: string = payload.achievement_type;
        const THRESHOLDS: Record<string, { category: "followers" | "posts" | "likes" | "comments"; threshold: number }> = {
          followers_10: { category: "followers", threshold: 10 },
          followers_20: { category: "followers", threshold: 20 },
          followers_30: { category: "followers", threshold: 30 },
          followers_40: { category: "followers", threshold: 40 },
          followers_50: { category: "followers", threshold: 50 },
          followers_100: { category: "followers", threshold: 100 },
          posts_5: { category: "posts", threshold: 5 },
          posts_10: { category: "posts", threshold: 10 },
          posts_25: { category: "posts", threshold: 25 },
          posts_50: { category: "posts", threshold: 50 },
          likes_10: { category: "likes", threshold: 10 },
          likes_50: { category: "likes", threshold: 50 },
          likes_100: { category: "likes", threshold: 100 },
          comments_10: { category: "comments", threshold: 10 },
          comments_50: { category: "comments", threshold: 50 },
          comments_100: { category: "comments", threshold: 100 },
        };
        const def = THRESHOLDS[type];
        if (!def) {
          return new Response(JSON.stringify({ error: "Unknown achievement" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        let actual = 0;
        if (def.category === "followers") {
          const { count } = await supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", callerUserId);
          actual = count ?? 0;
        } else if (def.category === "posts") {
          const { count } = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", callerUserId);
          actual = count ?? 0;
        } else if (def.category === "comments") {
          const { count } = await supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("user_id", callerUserId);
          actual = count ?? 0;
        } else if (def.category === "likes") {
          const { data: userPosts } = await supabase.from("posts").select("likes_count").eq("user_id", callerUserId);
          actual = (userPosts || []).reduce((s: number, p: any) => s + (p.likes_count || 0), 0);
        }
        if (actual < def.threshold) {
          return new Response(JSON.stringify({ error: "Threshold not met" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await supabase
          .from("achievements")
          .insert({ user_id: callerUserId, achievement_type: type });
        if (error && !String(error.message).includes("duplicate")) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }



      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
