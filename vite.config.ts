import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { publicSupabaseDefines } from "./src/lib/public-supabase-config";

export default defineConfig({
  plugins: [mcpPlugin()],
  vite: {
    // Vercel's Supabase integration supplies unprefixed public configuration.
    // Expose only the URL and publishable key, never the integration's secrets.
    define: publicSupabaseDefines(process.env),
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
