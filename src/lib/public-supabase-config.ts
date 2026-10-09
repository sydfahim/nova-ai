/** Map Vercel's Supabase integration variables to Vite's public configuration. */
export function publicSupabaseDefines(environment: Readonly<Record<string, string | undefined>>) {
  const url = environment["VITE_SUPABASE_URL"] || environment["SUPABASE_URL"];
  const key =
    environment["VITE_SUPABASE_PUBLISHABLE_KEY"] || environment["SUPABASE_PUBLISHABLE_KEY"];
  const defines: Record<string, string> = {};

  if (url) defines["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(url);
  if (key) {
    let isPublic = key.startsWith("sb_publishable_");
    if (!isPublic) {
      try {
        const payload = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString());
        isPublic = payload.role === "anon";
      } catch {
        // Reject opaque secret keys and malformed legacy keys.
      }
    }
    if (!isPublic)
      throw new Error("Supabase browser configuration requires a publishable or anon key.");
    defines["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(key);
  }

  return defines;
}
