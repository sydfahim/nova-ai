import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_conversations",
  title: "Search Nova conversations",
  description:
    "Search the signed-in user's Nova conversations by title text. Returns matching conversation ids and titles.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to look for in conversation titles."),
    limit: z.number().int().min(1).max(50).nullable().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const escaped = query.replace(/[%_]/g, (match) => `\\${match}`);

    const { data, error } = await supabase
      .from("threads")
      .select("id, title, updated_at")
      .ilike("title", `%${escaped}%`)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 10);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const matches = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
    }));

    return {
      content: [
        {
          type: "text",
          text:
            matches.length === 0
              ? `No conversations match "${query}".`
              : matches.map((m) => `${m.title} (${m.id})`).join("\n"),
        },
      ],
      structuredContent: { matches },
    };
  },
});
