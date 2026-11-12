/**
 * One streamed OpenRouter chat completion with its usage: tokens, cache reads and writes,
 * reasoning, and the billed cost (`usage.cost`, plus the upstream cost for a BYOK key).
 */
import type { Call, JsonSchema } from "./types";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const RETRIES = 4;

export type ChatMessage = Record<string, unknown> & { role: string };
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type Reply = {
  ok: boolean;
  error?: string;
  content: string;
  reasoningDetails: Array<Record<string, unknown>>;
  toolCalls: ToolCall[];
  call: Call;
};

export type ModelSpec = { id: string; effort?: string };

const EFFORTS = new Set(["none", "minimal", "low", "medium", "high", "xhigh"]);

/** `google/gemini-4-hydrogen:medium` is the model at that effort; other suffixes are the id's. */
export const parseModel = (text: string, effort?: string): ModelSpec => {
  const index = text.lastIndexOf(":");
  const suffix = index > 0 ? text.slice(index + 1) : "";
  if (EFFORTS.has(suffix)) return { id: text.slice(0, index), effort: suffix };
  return { id: text, ...(effort ? { effort } : {}) };
};

export const modelLabel = (model: ModelSpec) => (model.effort ? `${model.id}:${model.effort}` : model.id);

type Delta = {
  content?: string | null;
  reasoning?: string | null;
  reasoning_details?: Array<Record<string, unknown>>;
  tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>;
};
type Chunk = {
  model?: string;
  provider?: string;
  error?: unknown;
  choices?: Array<{ finish_reason?: string | null; delta?: Delta }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number } | null;
    completion_tokens_details?: { reasoning_tokens?: number } | null;
    cost?: number | null;
    is_byok?: boolean | null;
    cost_details?: { upstream_inference_cost?: number | null } | null;
  };
};

const events = (text: string): Chunk[] =>
  text.split("\n").flatMap((line) => {
    const data = line.trim().startsWith("data:") ? line.trim().slice(5).trim() : "";
    if (!data || data === "[DONE]") return [];
    try {
      return [JSON.parse(data) as Chunk];
    } catch {
      return [];
    }
  });

/** Streamed reasoning details merged by type and index, as OpenRouter streams them. */
const mergeReasoning = (parts: ReadonlyArray<Record<string, unknown>>) => {
  const merged = new Map<string, Record<string, unknown>>();
  for (const part of parts) {
    const key = `${String(part.type)}:${String(part.index ?? 0)}`;
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...part });
      continue;
    }
    for (const [field, value] of Object.entries(part)) {
      if (value === null || value === undefined) continue;
      current[field] =
        (field === "text" || field === "summary" || field === "data") && typeof value === "string"
          ? `${typeof current[field] === "string" ? current[field] : ""}${value}`
          : value;
    }
  }
  return [...merged.values()];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A call that never got a usable response. */
const failedCall = (model: ModelSpec, error: string, ms: number): Call => ({
  model: model.id,
  provider: "unknown",
  finishReason: "error",
  tokens: { input: 0, cached: 0, cacheWrite: 0, output: 0, reasoning: 0 },
  costUsd: 0,
  ms,
  toolCalls: 0,
  error,
});

/**
 * One call. Rate limits, server errors, and dropped connections are retried; the cost of a retried
 * attempt that streamed usage still counts, as the provider billed it. `session` keeps one
 * sample's calls on one provider and one prompt cache.
 */
export const chat = async (
  model: ModelSpec,
  body: { messages: readonly ChatMessage[]; tools?: readonly unknown[]; maxTokens: number; session: string },
  key = process.env.OPENROUTER_API_KEY,
): Promise<Reply & { billed: Call[] }> => {
  if (!key) throw new Error("OPENROUTER_API_KEY is not set.");
  const request = JSON.stringify({
    model: model.id,
    messages: body.messages,
    ...(body.tools?.length ? { tools: body.tools, parallel_tool_calls: true } : {}),
    ...(model.effort ? { reasoning: { effort: model.effort, enabled: model.effort !== "none" } } : {}),
    max_tokens: body.maxTokens,
    cache_control: { type: "ephemeral" },
    session_id: body.session.slice(0, 256),
    prompt_cache_key: body.session.slice(0, 64),
    stream: true,
    usage: { include: true },
  });
  const billed: Call[] = [];
  for (let attempt = 0; ; attempt++) {
    const started = performance.now();
    const retry = async (error: string) => {
      if (attempt >= RETRIES) return false;
      await sleep(2_000 * 2 ** attempt + Math.random() * 1_000);
      return true;
    };
    const fail = (error: string): Reply & { billed: Call[] } => {
      const call = failedCall(model, error, Math.round(performance.now() - started));
      return { ok: false, error, content: "", reasoningDetails: [], toolCalls: [], call, billed };
    };
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/neunzig-zehn/bench",
          "X-Title": "The Last 10",
        },
        body: request,
        signal: AbortSignal.timeout(900_000),
      });
      if (!response.ok || !response.body) {
        const text = (await response.text()).slice(0, 500);
        if ((response.status === 429 || response.status >= 500) && (await retry(text))) continue;
        return fail(`HTTP ${response.status}: ${text}`);
      }
      const chunks: Chunk[] = [];
      let ttftMs: number | undefined;
      let buffer = "";
      const decoder = new TextDecoder();
      for await (const bytes of response.body) {
        buffer += decoder.decode(bytes, { stream: true });
        const newline = buffer.lastIndexOf("\n");
        if (newline === -1) continue;
        for (const chunk of events(buffer.slice(0, newline))) {
          chunks.push(chunk);
          const delta = chunk.choices?.[0]?.delta;
          if (ttftMs === undefined && (delta?.content || delta?.reasoning || delta?.tool_calls || delta?.reasoning_details))
            ttftMs = performance.now() - started;
        }
        buffer = buffer.slice(newline + 1);
      }
      chunks.push(...events(buffer));
      const ms = Math.round(performance.now() - started);
      let content = "";
      let finishReason = "unknown";
      let streamError: string | undefined;
      const reasoning: Array<Record<string, unknown>> = [];
      const calls = new Map<number, ToolCall>();
      const call: Call = { ...failedCall(model, "", ms), finishReason: "unknown" };
      delete call.error;
      if (ttftMs !== undefined) call.ttftMs = Math.round(ttftMs);
      for (const chunk of chunks) {
        if (chunk.error) streamError = JSON.stringify(chunk.error).slice(0, 500);
        if (chunk.model) call.model = chunk.model;
        if (chunk.provider) call.provider = chunk.provider;
        for (const choice of chunk.choices ?? []) {
          if (choice.finish_reason) finishReason = choice.finish_reason;
          const delta = choice.delta;
          if (!delta) continue;
          if (delta.content) content += delta.content;
          if (Array.isArray(delta.reasoning_details)) reasoning.push(...delta.reasoning_details);
          for (const part of delta.tool_calls ?? []) {
            const index = part.index ?? 0;
            const current = calls.get(index) ?? { id: "", type: "function" as const, function: { name: "", arguments: "" } };
            if (part.id) current.id = part.id;
            if (part.function?.name) current.function.name += part.function.name;
            if (part.function?.arguments) current.function.arguments += part.function.arguments;
            calls.set(index, current);
          }
        }
        const usage = chunk.usage;
        if (!usage) continue;
        call.tokens = {
          input: usage.prompt_tokens ?? 0,
          cached: usage.prompt_tokens_details?.cached_tokens ?? 0,
          cacheWrite: usage.prompt_tokens_details?.cache_write_tokens ?? 0,
          output: usage.completion_tokens ?? 0,
          reasoning: usage.completion_tokens_details?.reasoning_tokens ?? 0,
        };
        const charged = Number(usage.cost ?? 0);
        const upstream = usage.is_byok ? Number(usage.cost_details?.upstream_inference_cost ?? 0) : 0;
        call.costUsd = (Number.isFinite(charged) ? charged : 0) + (Number.isFinite(upstream) ? upstream : 0);
      }
      call.finishReason = streamError ? "error" : finishReason;
      const toolCalls = [...calls].sort(([a], [b]) => a - b).map(([, value], index) => ({
        ...value,
        id: value.id || `call_${index}`,
      }));
      call.toolCalls = toolCalls.length;
      if (streamError) call.error = streamError;
      billed.push(call);
      if (streamError) {
        if (/429|rate|overloaded|timeout|unavailable|5\d\d/iu.test(streamError) && (await retry(streamError))) continue;
        return { ...fail(streamError), call };
      }
      return { ok: true, content, reasoningDetails: mergeReasoning(reasoning), toolCalls, call, billed };
    } catch (error) {
      if (await retry(String(error))) continue;
      return fail(String(error).slice(0, 500));
    }
  }
};

export type { JsonSchema };
