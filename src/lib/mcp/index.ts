import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listConversations from "./tools/list-conversations";
import readConversation from "./tools/read-conversation";
import searchConversations from "./tools/search-conversations";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "lqsolzjqxfeqhfsfgork";

export default defineMcp({
  name: "nova-your-ai-companion",
  title: "Nova: Your AI Companion",
  version: "0.1.0",
  instructions:
    "Tools for Nova, a personal AI assistant. Use `list_conversations` to see the signed-in user's Nova conversations, `search_conversations` to find one by title, and `read_conversation` to read a full transcript. All tools act as the signed-in Nova user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listConversations, searchConversations, readConversation],
});
