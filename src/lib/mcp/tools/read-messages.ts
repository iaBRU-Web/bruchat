import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "read_messages",
  title: "Read messages",
  description: "Fetch the most recent messages from a direct-message conversation the user participates in.",
  inputSchema: {
    conversation_id: z.string().uuid().describe("Conversation ID (from list_conversations)."),
    limit: z.number().int().min(1).max(100).optional().describe("Max messages (default 30)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ conversation_id, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("messages")
      .select("id, sender_id, content, created_at, message_type, image_url, video_url, audio_url")
      .eq("conversation_id", conversation_id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit ?? 30);
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    const ordered = (data ?? []).slice().reverse();
    return {
      content: [{ type: "text", text: JSON.stringify(ordered, null, 2) }],
      structuredContent: { messages: ordered },
    };
  },
});
