import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ThreadSidebar } from "@/components/nova/ThreadSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteThread, listThreads } from "@/lib/threads";
import { useTheme } from "@/lib/theme";

type NovaShellProps = {
  activeThreadId?: string | undefined;
  title: string;
  children: ReactNode;
};

export function NovaShell({ activeThreadId, title, children }: NovaShellProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: threads = [] } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: listThreads,
    enabled: !!user,
  });

  async function handleDelete(id: string) {
    try {
      await deleteThread(id);
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (id === activeThreadId) await navigate({ to: "/" });
    } catch {
      toast.error("Could not delete that conversation.");
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Could not sign out. Please try again.");
      return;
    }
    queryClient.clear();
    await navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <ThreadSidebar
      threads={threads}
      activeThreadId={activeThreadId}
      email={user?.email ?? ""}
      theme={theme}
      onToggleTheme={toggle}
      onNewChat={() => {
        setMobileOpen(false);
        void navigate({ to: "/" });
      }}
      onDeleteThread={handleDelete}
      onSignOut={handleSignOut}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-void text-ink">
      <div className="hidden md:flex">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="nova-enter">{sidebar}</div>
          <button
            type="button"
            aria-label="Close conversations"
            className="flex-1 bg-void/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="grid size-8 place-items-center rounded-md text-mute transition-colors duration-150 hover:bg-panel2 hover:text-ink md:hidden"
              aria-label="Conversations"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <span className="font-mono text-[10px] text-dim">/</span>
            <span className="truncate font-medium text-ink">{title}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
