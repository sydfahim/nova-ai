import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, safeValidateUIMessages, streamText, type UIMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { createNovaAIProvider, NOVA_SYSTEM_PROMPT } from "@/lib/ai-provider.server";
import { createUserClient, readBearerToken } from "@/lib/supabase-user.server";

type ChatRequestBody = { messages?: unknown; threadId?: unknown };

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

async function saveMessage(
  supabase: SupabaseClient<Database>,
  threadId: string,
  userId: string,
  message: UIMessage,
) {
  const { data: existing, error: lookupError } = await supabase
    .from("messages")
    .select("id")
    .eq("thread_id", threadId)
    .eq("client_id", message.id)
    .maybeSingle();

  if (lookupError) {
    console.error("message lookup failed", lookupError);
    return;
  }
  if (existing) return;

  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    user_id: userId,
    role: message.role,
    parts: JSON.parse(
      JSON.stringify(message.parts),
    ) as Database["public"]["Tables"]["messages"]["Insert"]["parts"] & unknown[],
    client_id: message.id,
  });

  if (error) console.error("message insert failed", error);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = readBearerToken(request);
        if (!token) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json().catch(() => null)) as ChatRequestBody | null;
        const messages = body?.messages;
        const threadId = typeof body?.threadId === "string" ? body.threadId : null;

        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }
        const validated = await safeValidateUIMessages({ messages });
        if (!validated.success || validated.data.length === 0) {
          return new Response("Bad request", { status: 400 });
        }

        let novaAI: ReturnType<typeof createNovaAIProvider>;
        try {
          novaAI = createNovaAIProvider();
        } catch {
          return new Response("AI is not configured", { status: 500 });
        }

        const supabase = createUserClient(token);
        const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (authError || !userId) {
          console.error("nova auth failed", authError?.message);
          return new Response("Unauthorized", { status: 401 });
        }

        const { data: thread, error: threadError } = await supabase
          .from("threads")
          .select("id, title")
          .eq("id", threadId)
          .maybeSingle();

        if (threadError) return new Response("Could not load conversation", { status: 500 });
        if (!thread) return new Response("Conversation not found", { status: 404 });

        const uiMessages = validated.data;
        const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");

        if (lastUser) {
          await saveMessage(supabase, threadId, userId, lastUser);
          if (thread.title === "New chat") {
            const title = messageText(lastUser).slice(0, 70) || "New chat";
            await supabase.from("threads").update({ title }).eq("id", threadId);
          } else {
            await supabase
              .from("threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          }
        }

        // Reasoning parts are display-only; drop them from history we resend.
        const modelInput = uiMessages.map((m) => ({
          ...m,
          parts: m.parts.filter((p) => p.type === "text" || p.type === "file"),
        }));

        const result = streamText({
          model: novaAI.model,
          system: NOVA_SYSTEM_PROMPT,
          messages: await convertToModelMessages(modelInput),
          providerOptions: novaAI.providerOptions,
          abortSignal: request.signal,
          onError: ({ error }) => console.error("nova stream error", error),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            await saveMessage(supabase, threadId, userId, responseMessage);
          },
        });
      },
    },
  },
});
