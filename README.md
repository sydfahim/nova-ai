# Nova

Nova is a personal AI assistant built with React, TanStack Start, TypeScript, Tailwind CSS, and Supabase.

## Local development

Use Node.js and npm with the checked-in `package-lock.json`:

```sh
cp .env.example .env
npm ci
npm run dev
```

Set `NOVA_AI_PROVIDER=openai`, `NOVA_AI_MODEL=gpt-6-astra`, and your server-side `OPENAI_API_KEY` in `.env` before using chat. The model ID is configurable; Nova currently sends requests to OpenAI's Responses API. Keep the API key server-side and never add a `VITE_` prefix. Supabase URL and publishable key are required for authentication and saved conversations. Never expose a service-role key in client-side variables.

## Checks

```sh
npm run build
npm run lint
npm run typecheck
npm test
```

Supabase schema changes are maintained as SQL migrations under `supabase/migrations`.

## Vercel

Import this repository with the TanStack Start framework preset and the default build settings. Nitro automatically targets Vercel in its build environment.

Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the intended Supabase project. The build maps these two public values to Vite's browser configuration; explicit `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` take precedence. Service-role and secret keys must never be used as the publishable key.

Chat also requires `NOVA_AI_PROVIDER=openai`, `NOVA_AI_MODEL=gpt-6-astra`, and `OPENAI_API_KEY` as a server-only Secret. The Supabase project must be active, have the migrations applied, and allow the production URL in its Auth redirect settings. A successful deployment alone does not verify authentication or AI responses.
