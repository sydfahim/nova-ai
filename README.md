# Nova

Nova is a personal AI assistant built with React, TanStack Start, TypeScript, Tailwind CSS, and Supabase.

## Local development

Use Node.js and the package manager corresponding to the checked-in lockfile:

```sh
cp .env.example .env
npm install
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
