import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { createFileRoute } from "@tanstack/react-router";

import { ChatSurface } from "@/components/nova/ChatSurface";
import { NovaShell } from "@/components/nova/NovaShell";
import { listThreads, loadThreadMessages } from "@/lib/threads";
import { useAuth } from "@/hooks/useAuth";

type ThreadSearch = { q?: string };

export const Route = createFileRoute("/_authenticated/c/$threadId")({
  validateSearch: (search: Record<string, unknown>): ThreadSearch => {
    const raw = search["q"];
    return typeof raw === "string" && raw.length > 0 ? { q: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Conversation — Nova" },
      {
        name: "description",
        content: "Continue a saved conversation with Nova, your personal AI assistant.",
      },
      { property: "og:title", content: "Conversation — Nova" },
      {
        property: "og:description",
        content: "Pick up a saved Nova thread exactly where you left it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { q } = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const draftKey = ["draft", user?.id, threadId];
  const initialParts = queryClient.getQueryData<UIMessage["parts"]>(draftKey);

  const { data: threads = [] } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: listThreads,
    enabled: !!user,
  });
  const {
    data: messages,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["messages", user?.id, threadId],
    queryFn: () => loadThreadMessages(threadId),
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const thread = threads.find((item) => item.id === threadId);

  return (
    <NovaShell activeThreadId={threadId} title={thread?.title ?? "Conversation"}>
      {error ? (
        <p role="alert" className="p-6 text-sm text-destructive">
          Could not load this conversation. Please reload to try again.
        </p>
      ) : isFetching || !messages ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="size-2 animate-pulse rounded-full bg-glow" />
        </div>
      ) : (
        <ChatSurface
          key={`${user?.id}:${threadId}`}
          threadId={threadId}
          initialMessages={messages}
          initialPrompt={messages.length === 0 ? q : undefined}
          initialParts={messages.length === 0 ? initialParts : undefined}
          onConsumeDraft={() => queryClient.removeQueries({ queryKey: draftKey, exact: true })}
        />
      )}
    </NovaShell>
  );
}
