import assert from "node:assert/strict";
import test from "node:test";
import { publicSupabaseDefines } from "./public-supabase-config.ts";

test("Vercel integration exposes only public Supabase configuration", () => {
  assert.deepEqual(
    publicSupabaseDefines({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      SUPABASE_SERVICE_ROLE_KEY: "private",
      SUPABASE_SECRET_KEY: "private",
      OPENAI_API_KEY: "private",
    }),
    {
      "import.meta.env.VITE_SUPABASE_URL": '"https://example.supabase.co"',
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": '"sb_publishable_test"',
    },
  );
});

test("explicit Vite configuration takes precedence and absent values remain unset", () => {
  assert.deepEqual(publicSupabaseDefines({}), {});
  assert.equal(
    publicSupabaseDefines({
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_override",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_default",
    })["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"],
    '"sb_publishable_override"',
  );
});

test("secret and service-role keys cannot be embedded in the browser", () => {
  const serviceRole = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  for (const key of ["sb_secret_test", serviceRole, "invalid"]) {
    assert.throws(
      () => publicSupabaseDefines({ SUPABASE_PUBLISHABLE_KEY: key }),
      /publishable or anon/,
    );
  }
});
