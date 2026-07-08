import { ADMIN_PASSWORD, issueAdminToken } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { password } = await req.json().catch(() => ({}));
    if (typeof password !== "string" || password.length < 4 || password.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Tiny delay to dampen brute force
    await new Promise(r => setTimeout(r, 300));
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      return new Response(JSON.stringify({ error: "Admin login not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Wrong password" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { token, exp } = await issueAdminToken();
    return new Response(JSON.stringify({ token, exp }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
