import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "@/lib/invoices/server/run-id.server.ts";
import { ASSISTANT_SYSTEM } from "../context";

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Answers one financial question using only the deterministic brief. */
export async function answerQuestion(request: Request, key: string, brief: string, history: ChatTurn[], question: string): Promise<string> {
  const gateway = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: gateway.fetch,
  });
  const result = await generateText({
    model: provider.responses("openai/gpt-6-astra"), maxRetries: 0, abortSignal: request.signal,
    system: ASSISTANT_SYSTEM,
    messages: [
      { role: "user", content: `Financial brief (authoritative data):\n${brief}` },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ],
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
  });
  return result.text;
}

export function safeAssistantError(error: unknown): { code: string; message: string | null } {
  const e = error as { statusCode?: number; cause?: unknown };
  if (!e.statusCode && e.cause) return safeAssistantError(e.cause);
  return { code: String(e.statusCode ?? "assistant_failed"), message: null };
}
