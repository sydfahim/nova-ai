import assert from "node:assert/strict";
import test from "node:test";

import { createNovaAIProvider, readNovaAIConfiguration } from "./ai-provider.server.ts";

const validEnvironment = {
  NOVA_AI_PROVIDER: "openai",
  NOVA_AI_MODEL: "gpt-6-astra",
  OPENAI_API_KEY: "unit-test-key",
};

test("reads the OpenAI provider, model, and server-side key from environment", () => {
  assert.deepEqual(readNovaAIConfiguration(validEnvironment), {
    provider: "openai",
    model: "gpt-6-astra",
    apiKey: "unit-test-key",
  });
});

test("requires provider, model, and key configuration", () => {
  assert.throws(() => readNovaAIConfiguration({}), /NOVA_AI_PROVIDER is required/);
  assert.throws(
    () => readNovaAIConfiguration({ ...validEnvironment, NOVA_AI_MODEL: " " }),
    /NOVA_AI_MODEL is required/,
  );
  assert.throws(
    () => readNovaAIConfiguration({ ...validEnvironment, OPENAI_API_KEY: " " }),
    /OPENAI_API_KEY is required/,
  );
});

test("rejects providers that are not implemented", () => {
  assert.throws(
    () => readNovaAIConfiguration({ ...validEnvironment, NOVA_AI_PROVIDER: "anthropic" }),
    /Unsupported NOVA_AI_PROVIDER: anthropic/,
  );
});

test("resolves the configured model through OpenAI Responses with privacy options", () => {
  const resolved = createNovaAIProvider(validEnvironment);

  assert.equal(resolved.model.provider, "openai.responses");
  assert.equal(resolved.model.modelId, "gpt-6-astra");
  assert.equal(resolved.providerOptions.openai.store, false);
  assert.equal(resolved.providerOptions.openai.reasoningEffort, "low");
});
