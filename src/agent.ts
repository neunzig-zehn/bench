/**
 * Runs one sample of a task: the model calls the task's tools, step by step, until it calls
 * `submit` or runs out of turns. Records every call's tokens, cost and time.
 */
import { chat, type ChatMessage, type ModelSpec } from "./openrouter";
import { scoreOf } from "./score";
import type { Call, Part, SampleRecord, Task, Tokens } from "./types";

const SUBMIT = "submit";

const toolSpec = (name: string, description: string, parameters: Record<string, unknown>) => ({
  type: "function",
  function: { name, description, parameters },
});

const parseArgs = (text: string): Record<string, unknown> | undefined => {
  try {
    const value = JSON.parse(text || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const sumTokens = (calls: readonly Call[]): Tokens =>
  calls.reduce(
    (sum, { tokens }) => ({
      input: sum.input + tokens.input,
      cached: sum.cached + tokens.cached,
      cacheWrite: sum.cacheWrite + tokens.cacheWrite,
      output: sum.output + tokens.output,
      reasoning: sum.reasoning + tokens.reasoning,
    }),
    { input: 0, cached: 0, cacheWrite: 0, output: 0, reasoning: 0 },
  );

export type Transcript = { messages: ChatMessage[]; calls: Call[]; answer: unknown };

export const runSample = async (
  task: Task,
  model: ModelSpec,
  sample: number,
): Promise<{ record: SampleRecord; transcript: Transcript }> => {
  const state = task.init();
  const session = `tl10-${task.id}-${sample}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const tools = [
    ...task.tools.map((tool) => toolSpec(tool.name, tool.description, tool.parameters)),
    toolSpec(SUBMIT, `Submit the final answer and end the task. ${task.answer.description}`, task.answer.schema),
  ];
  const messages: ChatMessage[] = [
    { role: "system", content: task.system },
    { role: "user", content: task.prompt },
  ];
  const calls: Call[] = [];
  let answer: unknown;
  let finished = false;
  let toolCalls = 0;
  let refused = 0;
  let error: string | undefined;
  let nudged = false;
  const started = performance.now();
  const maxTurns = task.maxTurns ?? 40;

  for (let turn = 0; turn < maxTurns && !finished; turn++) {
    const reply = await chat(model, { messages, tools, maxTokens: task.maxTokens ?? 32_000, session });
    calls.push(...reply.billed);
    if (!reply.ok) {
      if (!reply.billed.includes(reply.call)) calls.push(reply.call);
      error = reply.error;
      break;
    }
    messages.push({
      role: "assistant",
      content: reply.content || null,
      ...(reply.toolCalls.length ? { tool_calls: reply.toolCalls } : {}),
      ...(reply.reasoningDetails.length ? { reasoning_details: reply.reasoningDetails } : {}),
    });
    if (!reply.toolCalls.length) {
      if (nudged) break;
      nudged = true;
      messages.push({
        role: "user",
        content: `Continue with the tools. When you are done, call ${SUBMIT} with your answer.`,
      });
      continue;
    }
    const images: Part[] = [];
    for (const call of reply.toolCalls) {
      toolCalls++;
      const args = parseArgs(call.function.arguments);
      let output: unknown;
      if (!args) {
        refused++;
        output = { error: "Invalid arguments: not a JSON object." };
      } else if (call.function.name === SUBMIT) {
        answer = args;
        finished = true;
        output = { ok: true };
      } else {
        const tool = task.tools.find(({ name }) => name === call.function.name);
        if (!tool) {
          refused++;
          output = { error: `Unknown tool ${call.function.name}.` };
        } else {
          try {
            const result = await tool.run(args, state);
            if (result.refused) refused++;
            output = result.output;
            for (const url of result.images ?? []) images.push({ type: "image_url", image_url: { url } });
          } catch (thrown) {
            refused++;
            output = { error: String(thrown instanceof Error ? thrown.message : thrown) };
          }
        }
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: typeof output === "string" ? output : JSON.stringify(output),
      });
    }
    if (images.length && !finished)
      messages.push({ role: "user", content: [{ type: "text", text: "Images returned by the tool calls above, in order:" }, ...images] });
  }

  const grade = task.grade(finished ? answer : undefined, state);
  const record: SampleRecord = {
    model: model.id,
    ...(model.effort ? { effort: model.effort } : {}),
    track: task.track,
    lang: task.lang,
    task: task.id,
    sample,
    score: scoreOf(grade),
    checks: Object.fromEntries(
      Object.entries(grade.checks).map(([name, check]) => [
        name,
        typeof check === "boolean" ? (check ? 1 : 0) : typeof check === "number" ? check : check.score,
      ]),
    ),
    metrics: grade.metrics ?? {},
    finished,
    steps: calls.filter((call) => !call.error).length,
    toolCalls,
    refused,
    wallMs: Math.round(performance.now() - started),
    costUsd: calls.reduce((sum, call) => sum + call.costUsd, 0),
    tokens: sumTokens(calls),
    providers: [...new Set(calls.map((call) => call.provider).filter((provider) => provider !== "unknown"))],
    ...(error ? { error } : {}),
  };
  return { record, transcript: { messages, calls, answer } };
};
