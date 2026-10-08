import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type OAuthNamespace = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

type AuthorizationDetails = {
  client?: { name?: string } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search["authorization_id"] === "string" ? search["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-void px-6">
      <p className="max-w-[380px] text-sm leading-relaxed text-mute">
        Could not load this connection request: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: decideError } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect was returned. Try starting the connection again.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-void px-6 py-12">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-glow shadow-[0_0_12px_2px] shadow-glow/50" />
          <span className="text-sm font-semibold tracking-tight text-ink">Nova</span>
          <span className="font-mono text-[9px] tracking-widest text-dim">OS</span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink">
          Connect {clientName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {clientName} is asking to use Nova as you. It will be able to list, search and read your
          conversations. You can disconnect it at any time.
        </p>

        {error ? (
          <p role="alert" className="mt-4 font-mono text-[11px] text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void decide(true)}
            className="h-10 w-full rounded-md bg-glow font-medium text-glow-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void decide(false)}
            className="h-10 w-full rounded-md border border-line bg-panel text-sm font-medium text-ink transition-colors duration-150 hover:border-mute disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
