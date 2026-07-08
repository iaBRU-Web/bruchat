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
  name: "send_message",
  title: "Send message",
  description: "Send a plain-text message from the signed-in user into an existing direct-message conversation.",
  inputSchema: {
    conversation_id: z.string().uuid().describe("Target conversation ID."),
    text: z.string().trim().min(1).describe("Message body to send."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ conversation_id, text }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const { data, error } = await client
      .from("messages")
      .insert({
        conversation_id,
        sender_id: ctx.getUserId(),
        content: text,
        message_type: "text",
      })
      .select("id, created_at")
      .single();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    // Bump conversation timestamp (best-effort)
    await client
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id);
    return {
      content: [{ type: "text", text: `Sent message ${data.id}` }],
      structuredContent: { message: data },
    };
  },
});
