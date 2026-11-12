/**
 * Aggregates sample records into the leaderboard: per model and track the score (intelligence,
 * 0–100), the average time per task, and the average cost per task. A track's numbers are the
 * mean over its tasks of each task's mean over samples, so every task weighs the same.
 */
import { mean } from "./score";
import { LANGS, TRACKS, type Lang, type SampleRecord, type Track } from "./types";

export type Cell = {
  score: number;
  seconds: number;
  costUsd: number;
  steps: number;
  /** Share of input tokens read from the prompt cache. */
  cacheHit: number;
  finished: number;
  tasks: number;
  samples: number;
};

export type Summary = {
  models: string[];
  /** model → track → cell; "overall" is the mean over the tracks that ran. */
  cells: Record<string, Partial<Record<Track | "overall", Cell>>>;
  tasks: Record<string, Record<string, Cell & { track: Track; lang: Lang }>>;
  /** model → language → the overall cell over that language's tasks. */
  langs: Record<string, Partial<Record<Lang, Cell>>>;
};

const labelOf = (record: SampleRecord) => (record.effort ? `${record.model}:${record.effort}` : record.model);

const cellOf = (records: readonly SampleRecord[]): Cell => {
  const input = records.reduce((sum, record) => sum + record.tokens.input, 0);
  const cached = records.reduce((sum, record) => sum + record.tokens.cached, 0);
  return {
    score: mean(records.map((record) => record.score)) * 100,
    seconds: mean(records.map((record) => record.wallMs)) / 1000,
    costUsd: mean(records.map((record) => record.costUsd)),
    steps: mean(records.map((record) => record.steps)),
    cacheHit: input ? cached / input : 0,
    finished: mean(records.map((record) => (record.finished ? 1 : 0))),
    tasks: 1,
    samples: records.length,
  };
};

/** The mean of task cells, each task weighing the same. */
const meanCell = (cells: readonly Cell[]): Cell => ({
  score: mean(cells.map((cell) => cell.score)),
  seconds: mean(cells.map((cell) => cell.seconds)),
  costUsd: mean(cells.map((cell) => cell.costUsd)),
  steps: mean(cells.map((cell) => cell.steps)),
  cacheHit: mean(cells.map((cell) => cell.cacheHit)),
  finished: mean(cells.map((cell) => cell.finished)),
  tasks: cells.reduce((sum, cell) => sum + cell.tasks, 0),
  samples: cells.reduce((sum, cell) => sum + cell.samples, 0),
});

export const summarize = (records: readonly SampleRecord[]): Summary => {
  const models = [...new Set(records.map(labelOf))];
  const summary: Summary = { models, cells: {}, tasks: {}, langs: {} };
  for (const model of models) {
    const own = records.filter((record) => labelOf(record) === model);
    const taskCells: Record<string, Cell & { track: Track; lang: Lang }> = {};
    for (const task of [...new Set(own.map((record) => record.task))].sort()) {
      const samples = own.filter((record) => record.task === task);
      taskCells[task] = { ...cellOf(samples), track: samples[0]!.track, lang: samples[0]!.lang };
    }
    summary.langs[model] = {};
    for (const lang of LANGS) {
      const all = Object.values(taskCells).filter((cell) => cell.lang === lang);
      const tracks = TRACKS.map((track) => all.filter((cell) => cell.track === track)).filter((cells) => cells.length).map(meanCell);
      if (all.length) summary.langs[model]![lang] = { ...meanCell(all), score: mean(tracks.map((cell) => cell.score)) };
    }
    summary.tasks[model] = taskCells;
    const cells: Summary["cells"][string] = {};
    for (const track of TRACKS) {
      const trackCells = Object.values(taskCells).filter((cell) => cell.track === track);
      if (trackCells.length) cells[track] = meanCell(trackCells);
    }
    const tracks = TRACKS.flatMap((track) => (cells[track] ? [cells[track]] : []));
    if (tracks.length) {
      // Score: the mean over tracks. Time and cost: per task over all tasks, as a task costs.
      const all = Object.values(taskCells);
      cells.overall = { ...meanCell(all), score: mean(tracks.map((cell) => cell.score)) };
    }
    summary.cells[model] = cells;
  }
  return summary;
};

const money = (usd: number) => (usd >= 0.1 ? `$${usd.toFixed(2)}` : `$${usd.toFixed(4)}`);
const secs = (seconds: number) => `${seconds.toFixed(1)} s`;
const pct = (share: number) => `${Math.round(share * 100)} %`;

const table = (header: string[], rows: string[][]) =>
  [`| ${header.join(" | ")} |`, `| ${header.map((_, index) => (index ? "---:" : "---")).join(" | ")} |`, ...rows.map((row) => `| ${row.join(" | ")} |`)].join("\n");

export const formatMarkdown = (summary: Summary, title = "The Last 10 results") => {
  const lines = [`# ${title}`, ""];
  lines.push(
    "Score is intelligence from 0 to 100 (the mean of the tracks' scores). Time and cost are the average per task, one full multi-step run, including every retry the provider billed.",
    "",
  );
  lines.push("## Leaderboard", "");
  lines.push(
    table(
      ["Model", "Score", "Time per task", "Cost per task", "Steps", "Cache hit", "Finished"],
      [...summary.models]
        .sort((a, b) => (summary.cells[b]?.overall?.score ?? 0) - (summary.cells[a]?.overall?.score ?? 0))
        .map((model) => {
          const cell = summary.cells[model]?.overall;
          return cell
            ? [model, cell.score.toFixed(1), secs(cell.seconds), money(cell.costUsd), cell.steps.toFixed(1), pct(cell.cacheHit), pct(cell.finished)]
            : [model, "–", "–", "–", "–", "–", "–"];
        }),
    ),
    "",
  );
  const EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh"];
  const split = (label: string) => {
    const index = label.lastIndexOf(":");
    const effort = index > 0 ? label.slice(index + 1) : "";
    return EFFORTS.includes(effort) ? { base: label.slice(0, index), effort } : { base: label, effort: "default" };
  };
  const bases = [...new Set(summary.models.map((model) => split(model).base))];
  if (bases.some((base) => summary.models.filter((model) => split(model).base === base).length > 1)) {
    lines.push("## Reasoning levels", "");
    lines.push(
      table(
        ["Model", "Effort", "Score", "Time per task", "Cost per task", "Steps"],
        bases.flatMap((base) =>
          summary.models
            .filter((model) => split(model).base === base)
            .sort((a, b) => EFFORTS.indexOf(split(a).effort) - EFFORTS.indexOf(split(b).effort))
            .map((model) => {
              const cell = summary.cells[model]?.overall;
              return [base, split(model).effort, cell ? cell.score.toFixed(1) : "–", cell ? secs(cell.seconds) : "–", cell ? money(cell.costUsd) : "–", cell ? cell.steps.toFixed(1) : "–"];
            }),
        ),
      ),
      "",
    );
  }
  const langs = LANGS.filter((lang) => summary.models.some((model) => summary.langs[model]?.[lang]));
  if (langs.length > 1) {
    lines.push("## By language", "");
    lines.push(
      table(
        ["Model", ...langs.flatMap((lang) => [`${lang.toUpperCase()} score`, "time", "cost"])],
        summary.models.map((model) => [
          model,
          ...langs.flatMap((lang) => {
            const cell = summary.langs[model]?.[lang];
            return cell ? [cell.score.toFixed(1), secs(cell.seconds), money(cell.costUsd)] : ["–", "–", "–"];
          }),
        ]),
      ),
      "",
    );
  }
  for (const track of TRACKS) {
    const ran = summary.models.filter((model) => summary.cells[model]?.[track]);
    if (!ran.length) continue;
    lines.push(`## ${track[0]!.toUpperCase()}${track.slice(1)}`, "");
    lines.push(
      table(
        ["Model", "Score", "Time per task", "Cost per task", "Steps", "Cache hit"],
        ran.map((model) => {
          const cell = summary.cells[model]![track]!;
          return [model, cell.score.toFixed(1), secs(cell.seconds), money(cell.costUsd), cell.steps.toFixed(1), pct(cell.cacheHit)];
        }),
      ),
      "",
    );
    const tasks = [...new Set(ran.flatMap((model) => Object.entries(summary.tasks[model] ?? {}).filter(([, cell]) => cell.track === track).map(([task]) => task)))].sort();
    lines.push(
      table(
        ["Task", ...ran.flatMap((model) => [`${model} score`, "time", "cost"])],
        tasks.map((task) => [
          task,
          ...ran.flatMap((model) => {
            const cell = summary.tasks[model]?.[task];
            return cell ? [cell.score.toFixed(1), secs(cell.seconds), money(cell.costUsd)] : ["–", "–", "–"];
          }),
        ]),
      ),
      "",
    );
  }
  return lines.join("\n");
};
