import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import whoamiTool from "./tools/whoami";
import listConversationsTool from "./tools/list-conversations";
import readMessagesTool from "./tools/read-messages";
import sendMessageTool from "./tools/send-message";
import listNotificationsTool from "./tools/list-notifications";
import createPostTool from "./tools/create-post";
import listRecentPostsTool from "./tools/list-recent-posts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bruchat-mcp",
  title: "BRUChat MCP",
  version: "0.1.0",
  instructions:
    "Tools for BRUChat, a messenger and social app. Use `whoami` to identify the user, `list_conversations` and `read_messages` to browse DMs, `send_message` to reply, `list_notifications` for activity, and `list_recent_posts`/`create_post` for the social feed. Use `echo` to verify connectivity.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    echoTool,
    whoamiTool,
    listConversationsTool,
    readMessagesTool,
    sendMessageTool,
    listNotificationsTool,
    createPostTool,
    listRecentPostsTool,
  ],
});
