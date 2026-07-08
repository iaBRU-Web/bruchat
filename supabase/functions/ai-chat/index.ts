import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model registry: id -> {provider, model}
const MODELS: Record<string, { provider: "lovable" | "openai" | "groq" | "gemini"; model: string }> = {
  "lovable-gemini-flash":   { provider: "lovable", model: "google/gemini-3-flash-preview" },
  "lovable-gemini-pro":     { provider: "lovable", model: "google/gemini-2.5-pro" },
  "lovable-gpt-5":          { provider: "lovable", model: "openai/gpt-5" },
  "openai-gpt-4o-mini":     { provider: "openai",  model: "gpt-4o-mini" },
  "openai-gpt-4o":          { provider: "openai",  model: "gpt-4o" },
  "groq-llama-70b":         { provider: "groq",    model: "llama-3.3-70b-versatile" },
  "groq-llama-8b":          { provider: "groq",    model: "llama-3.1-8b-instant" },
  "groq-mixtral":           { provider: "groq",    model: "mixtral-8x7b-32768" },
  "gemini-2.0-flash":       { provider: "gemini",  model: "gemini-2.0-flash" },
  "gemini-1.5-pro":         { provider: "gemini",  model: "gemini-1.5-pro" },
};

const ENDPOINTS = {
  lovable: "https://ai.gateway.lovable.dev/v1/chat/completions",
  openai:  "https://api.openai.com/v1/chat/completions",
  groq:    "https://api.groq.com/openai/v1/chat/completions",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Convert Gemini SSE → OpenAI-style SSE chunks so frontend has one parser
async function geminiToOpenAIStream(model: string, apiKey: string, system: string, messages: { role: string; content: string }[]) {
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
    }),
  });
  if (!r.ok || !r.body) {
    const t = await r.text();
    throw new Error(`Gemini ${r.status}: ${t.slice(0, 200)}`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
          const parsed = JSON.parse(json);
          const text = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
          if (text) {
            const out = { choices: [{ delta: { content: text } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
          }
        } catch { /* ignore partial */ }
      }
    },
  });
  return stream;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require a valid Supabase user JWT to prevent anonymous credit drain
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!jwt) return jsonResp({ error: "Unauthorized" }, 401);
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(jwt);
    if (claimsErr || !claims?.claims?.sub) return jsonResp({ error: "Unauthorized" }, 401);

    const { messages, recentActivity, userName, modelId } = await req.json();
    const selected = MODELS[modelId] || MODELS["lovable-gemini-flash"];


    const systemPrompt = `You are BRU AI, a friendly and smart assistant built into BRUChat messenger. The user's name is ${userName || "User"}. You help users understand their activity, messages, and anything they ask about.

You have access to the user's recent activity context provided below. Use it to give personalized, helpful answers about what's happening in their chats and groups.

Recent activity context:
${recentActivity || "No recent activity data provided."}

Guidelines:
- Address the user by their name (${userName || "User"}) occasionally
- Be concise, friendly, and use emojis occasionally
- When discussing messages or activity, reference specific details from the context
- If asked about something not in the context, say so honestly
- You can help with general questions too
- Keep responses clear and well-formatted using markdown
- Sign off responses casually like a chat buddy`;

    // Gemini direct path → convert to OpenAI SSE
    if (selected.provider === "gemini") {
      const key = Deno.env.get("GEMINI_API_KEY");
      if (!key) return jsonResp({ error: "GEMINI_API_KEY not configured" }, 500);
      const stream = await geminiToOpenAIStream(selected.model, key, systemPrompt, messages);
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // OpenAI-compatible providers (Lovable AI / OpenAI / Groq)
    let url: string, key: string | undefined;
    if (selected.provider === "openai") { url = ENDPOINTS.openai; key = Deno.env.get("OPENAI_API_KEY"); }
    else if (selected.provider === "groq") { url = ENDPOINTS.groq; key = Deno.env.get("GROQ_API_KEY"); }
    else { url = ENDPOINTS.lovable; key = Deno.env.get("LOVABLE_API_KEY"); }

    if (!key) return jsonResp({ error: `${selected.provider.toUpperCase()}_API_KEY not configured` }, 500);

    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selected.model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      if (response.status === 429) return jsonResp({ error: "Rate limited. Try again shortly." }, 429);
      if (response.status === 402) return jsonResp({ error: "AI credits exhausted." }, 402);
      console.error(`${selected.provider} error:`, response.status, t.slice(0, 500));
      return jsonResp({ error: `${selected.provider} error: ${t.slice(0, 200)}` }, 500);
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-chat error:", e);
    return jsonResp({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
