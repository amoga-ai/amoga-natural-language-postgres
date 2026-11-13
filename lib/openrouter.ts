import { createOpenAI } from "@ai-sdk/openai";

// Routes model calls through OpenRouter, the same provider the Eve agent uses.
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const model = openrouter.chat("qwen/qwen3.6-flash");
