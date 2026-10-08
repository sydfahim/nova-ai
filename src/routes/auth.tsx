import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Nova — your personal AI assistant" },
      {
        name: "description",
        content:
          "Sign in to Nova to pick up your conversations, code answers and drafts exactly where you left them.",
      },
      { property: "og:title", content: "Sign in to Nova" },
      {
        property: "og:description",
        content: "Nova is a quiet, precise personal AI assistant. Sign in to continue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string | undefined } => ({
    next:
      typeof s["next"] === "string" && s["next"].startsWith("/") && !s["next"].startsWith("//")
        ? s["next"]
        : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const returnUrl = () => window.location.origin + (next ?? "/");

  useEffect(() => {
    if (!user) return;
    if (next) window.location.replace(next);
    else void navigate({ to: "/", replace: true });
  }, [user, navigate, next]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSentConfirmation(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: returnUrl() },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try again.");
      return;
    }
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
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Your conversations stay on your account, so every thread is here next time.
        </p>

        {sentConfirmation ? (
          <div className="mt-8 rounded-lg border border-line bg-panel p-4 text-sm leading-relaxed text-mute">
            Check <span className="text-ink">{email}</span> for a confirmation link, then come back
            and sign in.
          </div>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-dim focus:border-mute"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-dim focus:border-mute"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 h-10 w-full rounded-md bg-glow font-medium text-glow-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="h-10 w-full rounded-md border border-line bg-panel text-sm font-medium text-ink transition-colors duration-150 hover:border-mute disabled:opacity-50"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setSentConfirmation(false);
          }}
          className="mt-6 w-full text-center text-xs text-mute transition-colors duration-150 hover:text-ink"
        >
          {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
