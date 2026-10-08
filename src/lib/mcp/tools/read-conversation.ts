import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

type Part = { type?: string; text?: string };

function partsToText(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return (parts as Part[])
    .map((part) => (part?.type === "text" && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export default defineTool({
  name: "read_conversation",
  title: "Read a Nova conversation",
  description:
    "Read the full message transcript of one of the signed-in user's Nova conversations by id.",
  inputSchema: {
    conversationId: z.string().uuid().describe("Conversation id from list_conversations."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ conversationId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .select("id, title, created_at, updated_at")
      .eq("id", conversationId)
      .maybeSingle();

    if (threadError) throw new ToolError(threadError.message);
    if (!thread) throw new ToolError("Conversation not found");

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw new ToolError(error.message);

    const messages = (data ?? []).map((row) => ({
      id: row.id,
      role: row.role,
      text: partsToText(row.parts),
      createdAt: row.created_at,
    }));

    return {
      content: [
        {
          type: "text",
          text: [`# ${thread.title}`, ...messages.map((m) => `**${m.role}**: ${m.text}`)].join(
            "\n\n",
          ),
        },
      ],
      structuredContent: {
        conversation: {
          id: thread.id,
          title: thread.title,
          createdAt: thread.created_at,
          updatedAt: thread.updated_at,
          messages,
        },
      },
    };
  },
});
