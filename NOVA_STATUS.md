# Nova Status

Updated: 2026-10-09

## Source Imported

- Imported the text source files from Lovable project `2f97d5f5-200b-4dbf-a0d1-aca9d64d7d35`, HEAD `e0be5c8a108d4f56fa58a4f37f7062ebff539ee4` (last edited 2026-09-28). This is the current implementation snapshot available from Lovable.
- Local app now uses TanStack Start, TanStack Router, React 19, TypeScript, Vite, Tailwind v4, TanStack Query, Supabase Auth/JS, and the AI SDK/Lovable AI Gateway.
- Current routes: authenticated home and `/c/$threadId`, `/auth`, `/api/chat`, `/mcp`, OAuth consent, and protected-resource metadata.
- Implemented in source: email/password auth, Google OAuth entry point, per-user threads/messages, streamed AI chat, stop/regenerate, markdown/code rendering, conversation sidebar, themes, MCP conversation tools, and attachment input for images/PDFs/text/CSV/JSON with drag/drop and previews.
- Voice, audio, search, image generation, memory, task workspace, automations, and knowledge pages remain roadmap items.
- Lovable's source API did not provide the two binary assets intact. The small avatar image was replaced with the existing Nova mark/initial treatment, and the favicon uses a local SVG. Other UI source and styles were imported.
- A pre-import snapshot is at `../Nova-AI-Assistant-pre-lovable-20260929.tar.gz`. It excludes `.env`, dependencies/build output, and the test script that contained a literal service-role credential. The checkout's previous Git worktree was not stashable because `.git/index` is read-only in this environment.

## Supabase

- Target project: `lqsolzjqxfeqhfsfgork`, ACTIVE_HEALTHY, PostgreSQL 17.6, `us-east-1`.
- Before migration: six legacy Phase 2 tables (`conversations`, `messages`, `tasks`, `task_steps`, `audit_events`, `approval_requests`), all empty, RLS enabled, no policies, no recorded migrations. No Storage buckets, public functions, or Realtime publication were found.
- The old `public.messages` table was renamed to `public.legacy_phase2_messages` to preserve its schema/data. It had zero rows. Other legacy tables remain untouched.
- Applied migration `20260929133324_nova_chat_schema_with_owner_rls`. It creates the Lovable `threads` and `messages` schema, adds user foreign keys and indexes, and enables owner-scoped RLS. Message policies also verify that the parent thread belongs to the current user.
- Verified live schema, migration history, policies, and row counts after application. New `threads` and `messages` tables have zero rows and the expected RLS policies.
- The local Supabase config and MCP OAuth issuer now target `lqsolzjqxfeqhfsfgork`. The hosted Lovable project itself still reports a different configured Supabase project ID (`mkplpzgcvzqyhbqgutdv`); no hosted Lovable project settings were changed.
- Auth provider/redirect settings were not available through the Supabase management tools. The app now sends Google OAuth through the target Supabase Auth project; Google provider and redirect URLs still need to be configured there if not already set.
- Existing legacy tables remain RLS-enabled without policies, so direct `anon`/`authenticated` access remains denied. They are not used by the imported app.

## Local Setup and Verification

- Runtime: Node `v26.8.1`, npm `11.19.0` on macOS arm64. No `.npmrc`, proxy settings, engine constraint, `package-lock.json`, `npm-shrinkwrap.json`, or pnpm lockfile was present before install. `bun.lock` was the existing lockfile, but Bun is not installed; a bundled pnpm binary is available but is not the project's declared manager.
- npm's registry is the default `https://registry.npmjs.org/`. The sandbox could not resolve that hostname (`ENOTFOUND`); this was a sandbox/network DNS restriction, not a bad registry URL or proxy setting. The default npm cache also contains root-owned files (`npm cache verify` returned `EPERM`), and offline installation failed because required metadata was not cached (`ENOTCACHED`).
- Installed dependencies successfully using network-enabled npm with a fresh writable cache: `npm install --cache /private/tmp/nova-npm-cache --no-audit --no-fund`. It installed 618 packages and generated `package-lock.json`; no dependency declarations were intentionally changed for the install. To avoid the root-owned global cache on future installs, set the user npm cache to `~/Library/Caches/npm`; `npm cache verify` then passed, and a plain `npm install --no-audit --no-fund` succeeded. npm warns that `esbuild`/`fsevents` install scripts are unapproved, but the platform esbuild binary was present and ran successfully.
- Added the missing `typecheck` script (`tsc --noEmit`) to `package.json`. The package scripts are `dev`, `build`, `build:dev`, `preview`, `lint`, `typecheck`, and `format`.
- `npm run build`: PASS. Client, SSR, and Nitro builds completed. Informational warnings remain for large chunks, the `vite-tsconfig-paths` plugin being redundant with Vite's native path support, and a WebAssembly fallback; these did not fail the build.
- `npm run lint`: PASS with 13 existing React Fast Refresh warnings and no lint errors. Prettier formatting was applied to the imported TS/TSX/CSS and relevant config files to satisfy the existing lint rule; no intended behavior or UI changes were made by formatting.
- `npm run typecheck`: PASS (`tsc --noEmit`).
- `npm run dev -- --host 127.0.0.1 --force`: PASS; Vite serves at `http://127.0.0.1:8080/`. An older unresponsive Vite process and stale dependency optimization state caused the first SSR module-fetch timeout. After stopping the stale process and forcing dependency re-optimization, `/` returned HTTP 200 and the browser rendered Nova's sign-in screen. Static favicon/robots requests also returned HTTP 200.
- Browser verification: Nova document/title and sign-in UI loaded. Email/password and Google buttons render. A full login flow was not attempted because no test account credentials were supplied. Browser console/network inspection was unavailable through the connected browser surface; the Vite server reported no app runtime errors on the successful page load.
- Supabase connection: `GET /auth/v1/health` with the configured public key returned HTTP 200. Public Auth settings returned HTTP 200 and report email enabled, Google disabled. Google OAuth is wired to `supabase.auth.signInWithOAuth`, but cannot succeed until Google is enabled/configured in Supabase and redirect URLs are allowed.
- At the initial environment audit, chat was blocked because no AI Gateway key or signed-in test session was available. The provider migration and current OpenAI requirements are documented below; live chat still requires a valid server-side provider key and signed-in test session.
- Source API calls do not include binary download support, so the exact avatar and favicon binaries are unavailable in the local import.

## Security Follow-up

- The old untracked `scripts/test-live-supabase.ts` contained a literal service-role credential. The script is no longer in the checkout and was excluded from the backup archive; its value is not recorded here. Treat that credential as exposed and rotate it in the Supabase dashboard, then update dependent server environments. The existing `.env` was retained and is now explicitly gitignored; values were not changed or displayed.

## Existing Functionality Verification (2026-09-30)

### Verified

- The local `/auth` route loads and renders the sign-in fields and Google sign-in entry point. The form includes a sign-up mode, required email/password validation, and a six-character minimum password length. The browser already had an autofilled password and both auth actions appeared disabled during this pass, so I did not interact with its credential contents or submit anything.
- At the end of verification, port 8080 was already occupied. The dev server started on port 8081 and `GET http://127.0.0.1:8081/auth` returned HTTP 200. Use `http://127.0.0.1:8081/` for this server; the earlier 8080 server had stopped.
- Supabase Auth health and public settings were checked previously in this session: health returned HTTP 200, email auth is enabled, and Google OAuth is disabled. Email sign-up/sign-in are wired to `supabase.auth.signUp` and `signInWithPassword`; Google uses `signInWithOAuth({ provider: "google" })`.
- Auth state is held by `useAuth` using Supabase's persisted session, `onAuthStateChange`, and `getSession`. The authenticated route redirects signed-out users to `/auth` after client-side session loading.
- Chat API checks for a bearer token, validates it with Supabase `getClaims`, and looks up the requested thread through the user-scoped client. Database RLS restricts thread and message access to the owning user; message policies also verify ownership of the parent thread. The chat endpoint has its own bearer-token validation and does not rely on the UI route guard.
- Chat uses the AI SDK `useChat`/`DefaultChatTransport`, gets the current Supabase access token for requests, streams from `/api/chat`, and persists user/assistant messages in Supabase. Stop and regenerate handlers are present.
- Attachment UI accepts PNG/JPEG/WebP/GIF images, PDF, plain text, Markdown, CSV, and JSON, with up to 10 files at 10 MiB each. Composer code converts browser `blob:` URLs to data URLs before submission; text attachments are read into message text (capped at 200,000 characters each), and image/PDF file parts are forwarded to the model conversion path. This is source-level verification only; an authenticated live model request with attachments was not possible.
- `npm run typecheck`: PASS. `npm run lint`: PASS, 13 non-blocking `react-refresh/only-export-components` warnings. `npm run build`: PASS. `git diff --check`: PASS.
- The browser page rendered. The available browser surface in this verification provided accessibility/screenshot inspection but no usable console or network log interface; Vite showed no app runtime exception during successful page load.

### Unverified / Blocked

- Email/password registration, confirmation email delivery, sign-in, session persistence across reload, sign-out, and authenticated route access were not completed because no designated test account/credentials were supplied. Do not use the browser's autofilled credential as a test credential without the user's direction.
- Google OAuth cannot work until Google provider credentials and allowed redirect URLs are configured in Supabase. Current project settings report Google disabled.
- At the verification snapshot, chat, message persistence, stop/regenerate, gateway connectivity, and live attachment interpretation could not be end-to-end tested because no gateway key or authenticated test session was available. The gateway-specific blocker is superseded by the OpenAI provider migration below; authenticated live verification remains pending.
- Browser console and critical-request network inspection remain unverified because the connected browser control did not expose those logs in this pass.
- Attachment handling is verified by source tracing and TypeScript/build checks only; no authenticated file upload/request was performed.

### Required Environment Variables

- Browser and server Supabase configuration: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`.
- At the initial audit, chat server configuration used `AI_GATEWAY_API_KEY`. See the current provider variables under **OpenAI Provider Migration** below.
- `SUPABASE_SERVICE_ROLE_KEY` appears as an unused placeholder in `.env.example`; current browser/chat user-data paths use the publishable key plus the user's access token, not a service-role key. Do not configure/expose a service-role key in the frontend.

### Known Warnings / Errors

- ESLint: 13 non-blocking React Fast Refresh export warnings; zero lint errors.
- Build: warning that `vite-tsconfig-paths` is redundant with native Vite path support; Shiki WebAssembly bundling falls back to module mode; multiple chunks exceed 500 kB. Build succeeds.
- No reproducible auth, chat, or attachment code bug was found in the available source/build/browser checks. No feature or architectural changes were made during this verification pass.

### Next Development Task

- Once email auth and a real chat request are manually verified with a test account and the current OpenAI provider configuration, proceed to the planned Agent Runtime work. Do not treat the planned Agent Runtime, tools, memory, integrations, voice, or desktop app as existing functionality.
# Cleanup and verification (2026-09-29)

- Removed the obsolete Figma test asset, editor preview auth bridge, editor error telemetry, unused auth/cron helper, template metadata, and generic starter documentation.
- Replaced builder-branded documentation with Nova-specific local development instructions. OAuth Google sign-in now calls Supabase Auth directly.
- Kept the AI Gateway implementation and MCP integrations intact. The gateway implementation is now an unused rollback/reference module; MCP remains an independent integration.
- The environment issue and current command results are updated under **Local Setup and Verification** above; the previous dependency/network blockers are resolved for this checkout.
- At that time the chat route used `AI_GATEWAY_API_KEY`; see the current configuration and migration outcome below.

## OpenAI Provider Migration (2026-09-30)

- Replaced the active `/api/chat` model construction with the server-only `src/lib/ai-provider.server.ts` provider resolver. Provider and model are sourced only from server environment variables; the request body still accepts only messages and thread ID for model/chat input.
- Initial supported configuration is `NOVA_AI_PROVIDER=openai`, `NOVA_AI_MODEL=gpt-6-astra`, and server-only `OPENAI_API_KEY`. No `VITE_` key is used. OpenAI requests use the existing `@ai-sdk/openai` Responses API provider directly; no Lovable gateway URL or Lovable-specific headers are sent.
- Verified the direct model ID against OpenAI's official API model documentation: `gpt-6-astra` is listed as the API model ID and supports the Responses endpoint. This is not inferred by stripping `openai/` from the old gateway identifier.
- Preserved `/api/chat` input shape, Supabase bearer-token verification, thread ownership/RLS behavior, message persistence, system prompt, and UI message streaming. Provider configuration failures return the existing generic AI-not-configured response without exposing configuration values.
- Added focused Node test-runner checks for provider configuration, unsupported/missing settings, and OpenAI Responses model resolution. `@ai-sdk/openai` was already installed, so no provider dependency was added.
- Retained `src/lib/ai-gateway.server.ts` unchanged as a rollback/reference artifact; `/api/chat` no longer imports or calls it. Lovable MCP, OAuth, and Vite configuration were not changed.
- `npm test`: PASS (4 provider configuration/resolution tests). `git diff --check`: PASS.
- `npm run typecheck`, `npm run lint`, and `npm run build` were attempted but did not complete or produce diagnostics in this local run; their Node processes remained idle without output and were stopped. The prior baseline had passed all three, but this migration's full checks remain unverified here.
- No chat-route test harness existed, so route preservation was checked by source diff and provider tests; authenticated live chat still requires a valid OpenAI API key and a signed-in user. No secret was read or printed.

## Local verification and GitHub preparation (2026-10-06)

- Reinstalled dependencies with `npm ci` using `package-lock.json` after iCloud-offloaded (`dataless`) dependency files stalled Node. The old dependency directory is preserved outside the repository at `../.nova-node-modules-offloaded-20261006`. Additional iCloud downloads were requested for offloaded Git metadata and source files.
- Fixed the new-chat composer dropping attachments: prepared message parts now pass through a user-scoped, in-memory draft cache to the conversation screen. New prompts are no longer placed in the URL.
- Scoped thread/message caches to the authenticated user and clear caches after successful sign-out. Conversations refetch messages when reopened instead of retaining an indefinitely stale snapshot. Message-loading failures now display an error instead of an endless spinner.
- Added chat-body/message validation so malformed JSON, null bodies, and malformed message objects return HTTP 400. Missing bearer tokens still return HTTP 401.
- Corrected the provider's return type to match the concrete OpenAI Responses model and added three attachment tests. `npm test` passes all seven tests; `npm run typecheck`, `npm run lint`, and `npm run build` pass. Lint retains 13 existing Fast Refresh warnings; build retains non-blocking chunk/plugin warnings.
- Local Vite server: `http://127.0.0.1:8080/`. HTTP checks pass for home, auth, favicon, missing chat authorization, malformed JSON, null body, and malformed messages.
- Browser verification: sign-in renders, sign-up mode toggles, and signed-out home redirects to `/auth`. No warning/error console entries were observed in this browser pass.
- The user explicitly chose code and signed-out verification. Authenticated sign-in, live model responses, persistence, and attachment interpretation remain unverified end to end. Previously reported Google-provider configuration limitations have not been rechecked or changed.
- GitHub publishing is pending: `origin` is `https://github.com/sydfahim/Nova-AI-Assistant.git`, but both Git fetch and the connected GitHub repository API report repository not found. No remote update has been made.

## Vercel deployment repair (2026-10-09)

- Vercel deployment `7vZw61ckGrdJmswAnsKDDvhcDPrF` failed during dependency installation because TanStack Start was affected by CVE-2026-102989. Upgraded `@tanstack/react-start` to 1.168.60, `@tanstack/react-router` to 1.170.41, and `@tanstack/router-plugin` to 1.168.42. The npm lockfile resolves patched `@tanstack/start-server-core` 1.169.39. Removed the obsolete Bun lockfile so it cannot reinstall the vulnerable dependency tree.
- Adapted the root error component to the updated router's error props. Added an allowlisted build-time mapping from the Supabase integration's URL/publishable key to the Vite browser variables, with tests that reject service-role and secret keys. Explicit Vite variables retain precedence.
- Excluded generated `.vercel` output from Git and ESLint. The lint process was otherwise scanning generated deployment artifacts.
- Verified in `/private/tmp/nova-deploy-check` using a fresh dependency install, because iCloud-offloaded dependencies in Documents stall local tools: Vercel-targeted production build PASS, lint PASS (13 existing Fast Refresh warnings), typecheck PASS, and all 10 tests PASS. The deployment build generates `.vercel/output/config.json` and the server function. Public test configuration was used for the build; no live AI or authenticated database request was made.
- Original Supabase project `lqsolzjqxfeqhfsfgork` remains INACTIVE. Resume was rejected because the account has reached its two-active-free-project limit. Vercel's Supabase integration currently points to a different project, `zdhocrkvycalwitamrxt`; choosing a database target and freeing a slot or migrating data requires the user's decision. No backup was restored and no other project was paused.
- The downloaded SQL backup and its gzip copy match byte-for-byte. The storage ZIP passes validation and contains zero objects. Backup contents and credentials were not added to Git.
- `OPENAI_API_KEY`, `NOVA_AI_PROVIDER`, and `NOVA_AI_MODEL` were absent from the inspected Vercel settings. Chat needs these server-side values and a working database. Production deployment and authenticated verification are pending.
