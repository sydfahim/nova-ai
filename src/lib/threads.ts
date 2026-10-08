import type { UIMessage } from "ai";

import { supabase } from "@/integrations/supabase/client";

export type Thread = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function listThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createThread(userId: string, title = "New chat"): Promise<Thread> {
  const { data, error } = await supabase
    .from("threads")
    .insert({ user_id: userId, title })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function renameThread(id: string, title: string) {
  const { error } = await supabase.from("threads").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw error;
}

export async function loadThreadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, parts, client_id, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.client_id ?? row.id,
    role: row.role as UIMessage["role"],
    parts: (Array.isArray(row.parts) ? row.parts : []) as UIMessage["parts"],
    metadata: { createdAt: row.created_at },
  }));
}

/** Groups threads into human date buckets for the sidebar. */
export function groupThreads(threads: Thread[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - 7 * 86_400_000;

  const buckets: { label: string; threads: Thread[] }[] = [
    { label: "Today", threads: [] },
    { label: "Yesterday", threads: [] },
    { label: "Previous 7 days", threads: [] },
    { label: "Earlier", threads: [] },
  ];

  for (const thread of threads) {
    const time = new Date(thread.updated_at).getTime();
    if (time >= startOfToday) buckets[0]!.threads.push(thread);
    else if (time >= startOfYesterday) buckets[1]!.threads.push(thread);
    else if (time >= startOfWeek) buckets[2]!.threads.push(thread);
    else buckets[3]!.threads.push(thread);
  }

  return buckets.filter((bucket) => bucket.threads.length > 0);
}
