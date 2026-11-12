import sample from "./sample-summary.json";

export const TRACKS = ["docs", "plans", "calc", "hours", "cost", "dialog"] as const;
export type Track = (typeof TRACKS)[number];
export const LANGS = ["de", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** Copied from `Cell` and `Summary` in ../../src/report.ts; keep them in sync. */
export type Cell = {
  score: number;
  seconds: number;
  costUsd: number;
  steps: number;
  cacheHit: number;
  finished: number;
  tasks: number;
  samples: number;
};

export type Summary = {
  models: string[];
  cells: Record<string, Partial<Record<Track | "overall", Cell>>>;
  tasks: Record<string, Record<string, Cell & { track: Track; lang: Lang }>>;
  langs: Record<string, Partial<Record<Lang, Cell>>>;
};

/** `results/latest/meta.json`, written beside summary.json by whoever publishes a run. */
export type Meta = {
  /** ISO date of the run, e.g. "2026-11-12". */
  date: string;
  /** The benchmark's version, shown as e.g. "Version 0.1". */
  version?: string;
  /** Samples per task. */
  samples: number;
  /** The model labels that ran, as in `Summary.models`. */
  models: string[];
};

const latest = import.meta.glob<{ default: unknown }>("../../results/latest/{summary,meta}.json", { eager: true });
const summaryFile = latest["../../results/latest/summary.json"]?.default as Summary | undefined;

export const isSample = !summaryFile;
export const summary: Summary = summaryFile ?? (sample as Summary);
export const meta = (summaryFile ? latest["../../results/latest/meta.json"]?.default : undefined) as Meta | undefined;

const EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];

export type Row = { label: string; base: string; effort: string; cell: Cell };

export const rows: Row[] = summary.models.flatMap((label) => {
  const cell = summary.cells[label]?.overall;
  if (!cell) return [];
  const index = label.lastIndexOf(":");
  const effort = index > 0 ? label.slice(index + 1) : "";
  return [EFFORTS.includes(effort) ? { label, base: label.slice(0, index), effort, cell } : { label, base: label, effort: "", cell }];
});

const effortRank = (effort: string) => (EFFORTS.includes(effort) ? EFFORTS.indexOf(effort) : EFFORTS.length);

/** Base models with their reasoning levels from least to most, best base model first. */
export const families = [...new Set(rows.map((row) => row.base))]
  .map((base) => ({ base, levels: rows.filter((row) => row.base === base).sort((a, b) => effortRank(a.effort) - effortRank(b.effort)) }))
  .sort((a, b) => Math.max(...b.levels.map((row) => row.cell.score)) - Math.max(...a.levels.map((row) => row.cell.score)));

export const taskCount = Math.max(0, ...rows.map((row) => row.cell.tasks));
export const samplesPerTask = meta?.samples ?? (rows[0] ? Math.round(rows[0].cell.samples / rows[0].cell.tasks) : 0);
