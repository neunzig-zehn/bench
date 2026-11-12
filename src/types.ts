/** The six tracks of The Last 10. */
export const TRACKS = ["docs", "plans", "calc", "hours", "cost", "dialog"] as const;
export type Track = (typeof TRACKS)[number];

/** Every task runs in German and in English: the same data, prompts, and grading in each. */
export const LANGS = ["de", "en"] as const;
export type Lang = (typeof LANGS)[number];

export type JsonSchema = Record<string, unknown>;

/** A message part a model reads: text, or an image as a data or https URL. */
export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type Content = string | Part[];

/**
 * What a tool returns to the model. `output` is serialized as the tool message; `images` (data
 * URLs) follow in a user message, since not every provider takes images inside a tool result.
 */
export type ToolResult = { output: unknown; images?: string[]; refused?: boolean };

export type Tool<State> = {
  name: string;
  description: string;
  /** JSON schema of the arguments, an object. */
  parameters: JsonSchema;
  run: (args: Record<string, unknown>, state: State) => ToolResult | Promise<ToolResult>;
};

/**
 * A graded check: a score from 0 to 1 with weight 1, or with its own weight. A boolean counts as
 * 1 or 0.
 */
export type Check = boolean | number | { score: number; weight: number };

export type Grade = {
  checks: Record<string, Check>;
  /** Extra numbers a track reports beside the score, such as the mean deviation in percent. */
  metrics?: Record<string, number>;
};

/**
 * One task. The model starts from `prompt` and reaches the data only through `tools`, so every
 * task takes several steps; it ends by calling `submit` with an answer matching `answer.schema`.
 * `grade` scores the answer (undefined when the model never submitted) and the state its tool
 * calls left. `reference` is the ground-truth answer: grading it must give 1.
 */
export type Task<State = any, Answer = any> = {
  /** Unique, kebab-case, ending in the language: `cost-supplier-offer-unit-prices-de`. */
  id: string;
  track: Track;
  lang: Lang;
  title: string;
  /** What the task measures and the traps it sets, for the README and reviewers. */
  description: string;
  system: string;
  prompt: Content;
  init: () => State;
  tools: Tool<State>[];
  answer: { description: string; schema: JsonSchema };
  grade: (answer: Answer | undefined, state: State) => Grade;
  reference: Answer;
  /** State as a perfect run leaves it, for tasks graded on tool writes; defaults to `init()`. */
  referenceState?: () => State;
  /** Model calls before the run stops unfinished. Defaults to 40. */
  maxTurns?: number;
  /** Output limit per call. Defaults to 32k. */
  maxTokens?: number;
};

export type Tokens = {
  input: number;
  /** Input tokens read from the provider's prompt cache. */
  cached: number;
  cacheWrite: number;
  output: number;
  /** Part of `output`. */
  reasoning: number;
};

/** One model call. */
export type Call = {
  model: string;
  provider: string;
  finishReason: string;
  tokens: Tokens;
  costUsd: number;
  ms: number;
  ttftMs?: number;
  toolCalls: number;
  error?: string;
};

/** One sample of one task on one model: what the report aggregates. */
export type SampleRecord = {
  model: string;
  effort?: string;
  track: Track;
  lang: Lang;
  task: string;
  sample: number;
  score: number;
  checks: Record<string, number>;
  metrics: Record<string, number>;
  /** The model called `submit`. */
  finished: boolean;
  steps: number;
  toolCalls: number;
  refused: number;
  wallMs: number;
  costUsd: number;
  tokens: Tokens;
  providers: string[];
  error?: string;
};
