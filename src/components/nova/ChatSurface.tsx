import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Copy, FileText, RefreshCw, Square } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { NovaComposer } from "@/components/nova/NovaComposer";
import { buildUserParts } from "@/lib/attachments";
import { supabase } from "@/integrations/supabase/client";

type ChatSurfaceProps = {
  threadId: string;
  initialMessages: UIMessage[];
  initialPrompt?: string | undefined;
  initialParts?: UIMessage["parts"] | undefined;
  onConsumeDraft?: () => void;
};

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

function timeOf(message: UIMessage): string | null {
  const raw = (message.metadata as { createdAt?: string } | undefined)?.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatSurface({
  threadId,
  initialMessages,
  initialPrompt,
  initialParts,
  onConsumeDraft,
}: ChatSurfaceProps) {
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const sentInitial = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, regenerate, stop, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
      composerRef.current?.focus();
    },
    onError: (chatError) => {
      toast.error(chatError.message || "Nova could not answer that. Try again.");
    },
  });

  useEffect(() => {
    if ((!initialPrompt && !initialParts) || sentInitial.current) return;
    sentInitial.current = true;
    onConsumeDraft?.();
    void sendMessage(initialParts ? { parts: initialParts } : { text: initialPrompt! });
  }, [initialPrompt, initialParts, onConsumeDraft, sendMessage]);

  useEffect(() => {
    composerRef.current?.focus();
  }, [threadId]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <Conversation className="nova-scroll flex-1">
        <ConversationContent className="mx-auto w-full max-w-[640px] space-y-8 px-4 py-10 sm:px-6">
          {messages.map((message) => {
            const body = textOf(message);
            const time = timeOf(message);
            if (message.role === "user") {
              return (
                <div key={message.id} className="nova-enter flex gap-3">
                  <div
                    className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-panel2"
                    aria-hidden="true"
                  >
                    <span className="font-mono text-[9px] text-mute">U</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {message.parts.some((p) => p.type === "file") ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {message.parts
                          .filter((p) => p.type === "file")
                          .map((p, i) =>
                            p.mediaType?.startsWith("image/") ? (
                              <img
                                key={i}
                                src={p.url}
                                alt={p.filename ?? ""}
                                className="max-h-48 rounded-md border border-line object-cover"
                              />
                            ) : (
                              <span
                                key={i}
                                className="flex items-center gap-2 rounded-md border border-line bg-panel2 px-3 py-2 text-[11px] text-mute"
                              >
                                <FileText className="size-3.5" />
                                {p.filename ?? "file"}
                              </span>
                            ),
                          )}
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink/90">
                      {body
                        .replace(/\s*<attached_file name="[^"]*">[\s\S]*?<\/attached_file>/g, "")
                        .trim()}
                    </p>
                  </div>
                  {time ? (
                    <span className="shrink-0 self-start font-mono text-[9px] tabular-nums leading-7 text-dim [writing-mode:vertical-rl]">
                      {time}
                    </span>
                  ) : null}
                </div>
              );
            }

            return (
              <div key={message.id} className="nova-enter group flex gap-3">
                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-panel2">
                  <span className="size-2 rounded-full bg-glow shadow-[0_0_10px_2px] shadow-glow/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">Nova</span>
                    {busy && message.id === messages[messages.length - 1]?.id ? (
                      <span className="font-mono text-[9px] tracking-widest text-dim">
                        STREAMING
                      </span>
                    ) : null}
                  </div>
                  <Message from="assistant" className="block">
                    <MessageContent className="nova-response bg-transparent p-0 text-[14px] leading-[1.6] text-ink/85">
                      <MessageResponse>{body}</MessageResponse>
                    </MessageContent>
                  </Message>
                  <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(body);
                        toast("Copied");
                      }}
                      className="flex h-7 items-center gap-1.5 rounded-md px-2.5 font-mono text-[10px] text-mute transition-colors duration-150 hover:bg-panel2 hover:text-ink"
                    >
                      <Copy className="size-3" /> copy
                    </button>
                    <button
                      type="button"
                      title="Regenerate"
                      onClick={() => void regenerate()}
                      disabled={busy}
                      className="grid size-7 place-items-center rounded-md text-dim transition-colors duration-150 hover:bg-panel2 hover:text-ink disabled:opacity-40"
                    >
                      <RefreshCw className="size-3" />
                    </button>
                  </div>
                </div>
                {time ? (
                  <span className="shrink-0 self-start font-mono text-[9px] tabular-nums leading-7 text-dim [writing-mode:vertical-rl]">
                    {time}
                  </span>
                ) : null}
              </div>
            );
          })}

          {status === "submitted" ? (
            <div className="nova-enter flex gap-3">
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-panel2">
                <span className="size-2 animate-pulse rounded-full bg-glow" />
              </div>
              <Shimmer className="text-[14px]">Thinking…</Shimmer>
            </div>
          ) : null}

          {busy ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => stop()}
                className="flex h-8 items-center gap-2 rounded-full border border-line bg-panel px-3.5 text-[12px] font-medium text-ink transition-colors duration-150 hover:border-mute"
              >
                <Square className="size-3 fill-current" /> Stop generating
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="text-center font-mono text-[11px] text-destructive">{error.message}</p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <NovaComposer
        ref={composerRef}
        status={status}
        onStop={stop}
        onSend={(text, files) => {
          void buildUserParts(text, files)
            .then((parts) => sendMessage({ parts }))
            .catch(() => toast.error("Could not read that file. Try again."));
        }}
      />
    </>
  );
}
