import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_conversations",
  title: "List Nova conversations",
  description:
    "List the signed-in user's Nova conversations, most recently updated first. Returns id, title and timestamps.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).nullable().describe("Max conversations (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("threads")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 20);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const conversations = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      content: [
        {
          type: "text",
          text:
            conversations.length === 0
              ? "No conversations yet."
              : conversations
                  .map((c) => `${c.title} (${c.id}) — updated ${c.updatedAt}`)
                  .join("\n"),
        },
      ],
      structuredContent: { conversations },
    };
  },
});
