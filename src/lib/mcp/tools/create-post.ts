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
  name: "create_post",
  title: "Create post",
  description: "Publish a new text post on the BRUChat social feed as the signed-in user.",
  inputSchema: {
    content: z.string().trim().min(1).describe("Post body text."),
    is_public: z.boolean().optional().describe("Public visibility (default true)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ content, is_public }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("posts")
      .insert({
        user_id: ctx.getUserId(),
        content,
        is_public: is_public ?? true,
        post_type: "text",
      })
      .select("id, created_at")
      .single();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Post created: ${data.id}` }],
      structuredContent: { post: data },
    };
  },
});
