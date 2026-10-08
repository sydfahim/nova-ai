import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, Plus, Trash2, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { groupThreads, type Thread } from "@/lib/threads";
import { cn } from "@/lib/utils";

type ThreadSidebarProps = {
  threads: Thread[];
  activeThreadId?: string | undefined;
  email: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNewChat: () => void;
  onDeleteThread: (id: string) => void;
  onSignOut: () => void;
  onNavigate?: () => void;
};

export function ThreadSidebar({
  threads,
  activeThreadId,
  email,
  theme,
  onToggleTheme,
  onNewChat,
  onDeleteThread,
  onSignOut,
  onNavigate,
}: ThreadSidebarProps) {
  const groups = groupThreads(threads);

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-glow shadow-[0_0_12px_2px] shadow-glow/50" />
          <span className="text-sm font-semibold tracking-tight text-ink">Nova</span>
          <span className="font-mono text-[9px] tracking-widest text-dim">OS</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          title="Toggle theme"
          className="grid size-6 place-items-center rounded-md border border-line text-mute transition-colors duration-150 hover:border-mute hover:text-ink"
        >
          {theme === "dark" ? <Sun className="size-3" /> : <Moon className="size-3" />}
        </button>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-panel2 px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-mute"
        >
          <Plus className="size-3.5 text-glow" />
          New chat
        </button>
      </div>

      <div className="nova-scroll flex-1 space-y-5 overflow-y-auto px-3 pb-3">
        {groups.length === 0 ? (
          <p className="px-1 pt-2 font-mono text-[10px] leading-relaxed text-dim">
            No conversations yet.
          </p>
        ) : null}

        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-1 pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.threads.map((thread) => {
                const active = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-md pr-1 transition-colors duration-150",
                      active ? "border border-line bg-panel" : "border border-transparent",
                    )}
                  >
                    <Link
                      to="/c/$threadId"
                      params={{ threadId: thread.id }}
                      onClick={onNavigate}
                      className={cn(
                        "min-w-0 flex-1 truncate px-3 py-2 text-sm transition-colors duration-150",
                        active ? "text-ink" : "text-mute hover:text-ink",
                      )}
                    >
                      {thread.title}
                    </Link>
                    <button
                      type="button"
                      title="Delete conversation"
                      onClick={() => onDeleteThread(thread.id)}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-dim opacity-0 transition-opacity duration-150 hover:text-ink group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mute"
            >
              <span
                className="grid size-7 place-items-center rounded-full border border-line bg-panel2"
                aria-hidden="true"
              >
                <span className="size-2 rounded-full bg-glow shadow-[0_0_10px_2px] shadow-glow/50" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink">{email}</p>
                <p className="font-mono text-[9px] text-dim">Signed in</p>
              </div>
              <ChevronsUpDown className="size-3.5 text-dim" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-[236px] border-line bg-panel">
            <DropdownMenuLabel className="truncate font-mono text-[10px] font-normal text-dim">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-line" />
            <DropdownMenuItem onSelect={onToggleTheme} className="text-sm">
              {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-line" />
            <DropdownMenuItem onSelect={onSignOut} className="text-sm">
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
