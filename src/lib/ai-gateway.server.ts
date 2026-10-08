import { createOpenAI } from "@ai-sdk/openai";

/**
 * Server-only Responses provider for Nova's configured AI gateway.
 * The API key never leaves the server. Create per request.
 */
export function createNovaResponsesModel(apiKey: string) {
  const gateway = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  return gateway.responses(NOVA_MODEL);
}

export const NOVA_PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export const NOVA_MODEL = "openai/gpt-6-astra";

export const NOVA_SYSTEM_PROMPT = `You are Nova, a precise personal AI assistant.

Voice: calm, exact, and useful. No filler, no flattery, no restating the question.
Formatting: markdown. Use fenced code blocks with a language tag for any code.
Be concise by default and go deep when the request is technical.
When the user attaches images, PDFs or text files, read them carefully and ground your answer in their contents.
If you are unsure, say what you'd need to be sure.`;
