import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { FileUIPart } from "ai";

import { NovaComposer } from "@/components/nova/NovaComposer";
import { NovaShell } from "@/components/nova/NovaShell";
import { useAuth } from "@/hooks/useAuth";
import { createThread } from "@/lib/threads";
import { buildUserParts } from "@/lib/attachments";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Nova — your personal AI assistant" },
      {
        name: "description",
        content:
          "Nova is a calm, precise personal AI assistant: ask anything, get answers, code and drafts, with every conversation saved to your account.",
      },
      { property: "og:title", content: "Nova — your personal AI assistant" },
      {
        property: "og:description",
        content: "A quiet desk for sharp intent. Ask Nova anything and keep every thread.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovaHome,
});

const STARTERS = [
  "Explain this error and how to fix it",
  "Draft a short, direct follow-up email",
  "Plan my week around three priorities",
];

function NovaHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  async function start(text: string, files: FileUIPart[] = []) {
    if (!user || creating) return;
    setCreating(true);
    try {
      const parts = await buildUserParts(text, files);
      const thread = await createThread(user.id, text.slice(0, 70) || "New chat");
      queryClient.setQueryData(["draft", user.id, thread.id], parts);
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      await navigate({ to: "/c/$threadId", params: { threadId: thread.id } });
    } catch {
      setCreating(false);
      toast.error("Could not start a new conversation.");
    }
  }

  return (
    <NovaShell title="New chat">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="grid size-12 place-items-center rounded-xl border border-line bg-panel">
          <span className="size-2.5 rounded-full bg-glow shadow-[0_0_16px_3px] shadow-glow/50" />
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
          Nova · personal operating system
        </p>
        <h1 className="mt-3 max-w-[16ch] text-[28px] font-semibold leading-tight tracking-tight text-ink">
          A quiet desk for sharp intent.
        </h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-mute">
          Start a thread and Nova handles the drafting, the code, and the follow-through.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => void start(starter)}
              className="rounded-full border border-line bg-panel px-4 py-2 text-[12px] font-medium text-mute transition-colors duration-150 hover:border-mute hover:text-ink"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      <NovaComposer
        ref={composerRef}
        status={creating ? "submitted" : "ready"}
        onSend={(text, files) => void start(text, files)}
      />
    </NovaShell>
  );
}
