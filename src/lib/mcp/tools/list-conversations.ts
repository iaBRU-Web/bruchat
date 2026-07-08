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
  name: "list_conversations",
  title: "List conversations",
  description: "List the signed-in user's most recent direct-message conversations with the other participant's profile.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max conversations to return (default 20)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const uid = ctx.getUserId();
    const { data: convos, error } = await client
      .from("conversations")
      .select("id, participant_a, participant_b, last_message_at")
      .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
      .order("last_message_at", { ascending: false })
      .limit(limit ?? 20);
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    const otherIds = (convos ?? []).map((c) => (c.participant_a === uid ? c.participant_b : c.participant_a));
    const { data: profiles } = otherIds.length
      ? await client.from("profiles").select("id, username, display_name").in("id", otherIds)
      : { data: [] as any[] };
    const map: Record<string, any> = {};
    (profiles ?? []).forEach((p: any) => { map[p.id] = p; });

    const items = (convos ?? []).map((c) => {
      const otherId = c.participant_a === uid ? c.participant_b : c.participant_a;
      return {
        conversation_id: c.id,
        last_message_at: c.last_message_at,
        other_user: map[otherId] ?? { id: otherId },
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { conversations: items },
    };
  },
});
