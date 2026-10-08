import { createOpenAI } from "@ai-sdk/openai";

export type NovaAIProvider = "openai";

export type NovaAIConfiguration = {
  provider: NovaAIProvider;
  model: string;
  apiKey: string;
};

type Environment = Readonly<Record<string, string | undefined>>;
type NovaAIProviderOptions = {
  openai: {
    reasoningEffort: "low";
    reasoningSummary: "auto";
    store: false;
    include: string[];
  };
};
type ResolvedNovaAIProvider = {
  model: ReturnType<ReturnType<typeof createOpenAI>["responses"]>;
  providerOptions: NovaAIProviderOptions;
};

export function readNovaAIConfiguration(
  environment: Environment = process.env,
): NovaAIConfiguration {
  const provider = environment["NOVA_AI_PROVIDER"]?.trim();
  if (!provider) throw new Error("NOVA_AI_PROVIDER is required.");
  if (provider !== "openai") {
    throw new Error(`Unsupported NOVA_AI_PROVIDER: ${provider}.`);
  }

  const model = environment["NOVA_AI_MODEL"]?.trim();
  if (!model) throw new Error("NOVA_AI_MODEL is required.");

  const apiKey = environment["OPENAI_API_KEY"]?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for the OpenAI provider.");

  return { provider, model, apiKey };
}

export const NOVA_SYSTEM_PROMPT = `You are Nova, a precise personal AI assistant.

Voice: calm, exact, and useful. No filler, no flattery, no restating the question.
Formatting: markdown. Use fenced code blocks with a language tag for any code.
Be concise by default and go deep when the request is technical.
When the user attaches images, PDFs or text files, read them carefully and ground your answer in their contents.
If you are unsure, say what you'd need to be sure.`;

/** Resolves a server-configured provider; client requests cannot select a model or provider. */
export function createNovaAIProvider(
  environment: Environment = process.env,
): ResolvedNovaAIProvider {
  const configuration = readNovaAIConfiguration(environment);

  switch (configuration.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: configuration.apiKey });
      return {
        model: openai.responses(configuration.model),
        providerOptions: {
          openai: {
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      };
    }
    default: {
      const unsupportedProvider: never = configuration.provider;
      throw new Error(`Unsupported Nova AI provider: ${unsupportedProvider}.`);
    }
  }
}
