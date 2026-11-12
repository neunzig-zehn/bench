#!/usr/bin/env bun
/**
 *   bun bench --models google/gemini-4-hydrogen:medium,openai/gpt-6.1-terra:medium
 *   bun bench --models openai/gpt-6.1-terra --tracks docs,cost --samples 3 --concurrency 8
 *   bun bench --models openai/gpt-6.1-terra --lang de
 *   bun bench --list
 *   bun report results/<run>
 *
 * Each run writes `results/<run>/records.jsonl` (one line per sample), `summary.json`,
 * `summary.md`, `meta.json`, and the full transcripts under `traces/` (not committed). Running
 * again into the same `--out` resumes: samples already in its records are skipped.
 */
import { mkdir, appendFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { runSample } from "./agent";
import { modelLabel, parseModel } from "./openrouter";
import { ALL_TASKS } from "./registry";
import { formatMarkdown, summarize } from "./report";
import { LANGS, TRACKS, type Lang, type SampleRecord, type Track } from "./types";

const argv = Bun.argv.slice(2);
if (argv[0] === "report") {
  const dir = argv[1];
  if (!dir) throw new Error("Usage: bun report results/<run>");
  const records = (await Bun.file(`${dir}/records.jsonl`).text())
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SampleRecord);
  const summary = summarize(records);
  await Bun.write(`${dir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
  await Bun.write(`${dir}/summary.md`, formatMarkdown(summary));
  console.log(formatMarkdown(summary));
  process.exit(0);
}

const { values } = parseArgs({
  args: argv,
  options: {
    models: { type: "string" },
    effort: { type: "string" },
    tracks: { type: "string" },
    tasks: { type: "string" },
    lang: { type: "string" },
    samples: { type: "string", default: "3" },
    concurrency: { type: "string", default: "8" },
    out: { type: "string" },
    list: { type: "boolean", default: false },
  },
});

const split = (text?: string) => (text ?? "").split(",").map((part) => part.trim()).filter(Boolean);
const tracks = split(values.tracks) as Track[];
for (const track of tracks) if (!TRACKS.includes(track)) throw new Error(`Unknown track ${track}; tracks: ${TRACKS.join(", ")}`);
const wanted = split(values.tasks);
const langs = split(values.lang) as Lang[];
for (const lang of langs) if (!LANGS.includes(lang)) throw new Error(`Unknown language ${lang}; languages: ${LANGS.join(", ")}`);
const tasks = ALL_TASKS.filter(
  (task) =>
    (!tracks.length || tracks.includes(task.track)) &&
    (!langs.length || langs.includes(task.lang)) &&
    (!wanted.length || wanted.some((id) => task.id.includes(id))),
);

if (values.list) {
  for (const task of ALL_TASKS) console.log(`${task.track.padEnd(7)} ${task.lang} ${task.id.padEnd(44)} ${task.title}`);
  process.exit(0);
}
const models = split(values.models).map((model) => parseModel(model, values.effort));
if (!models.length) throw new Error("Pass --models, e.g. --models google/gemini-4-hydrogen:medium,openai/gpt-6.1-terra:medium");
if (!tasks.length) throw new Error("No task matches --tracks/--tasks.");
const samples = Number(values.samples);
const concurrency = Number(values.concurrency);

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/gu, "-");
const dir = values.out ?? `results/${stamp}`;
await mkdir(`${dir}/traces`, { recursive: true });

const records: SampleRecord[] = (await Bun.file(`${dir}/records.jsonl`).text().catch(() => ""))
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line) as SampleRecord);
const recorded = new Set(records.map((record) => `${record.effort ? `${record.model}:${record.effort}` : record.model}|${record.task}|${record.sample}`));
const jobs = models
  .flatMap((model) =>
    tasks.flatMap((task) => Array.from({ length: samples }, (_, index) => ({ model, task, sample: index + 1 }))),
  )
  .filter(({ model, task, sample }) => !recorded.has(`${modelLabel(model)}|${task.id}|${sample}`));
console.log(
  `${jobs.length} runs: ${models.length} model(s) × ${tasks.length} task(s) × ${samples} sample(s), ${concurrency} at a time → ${dir}${records.length ? ` (resuming; ${records.length} sample(s) already recorded)` : ""}`,
);

let done = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const { model, task, sample } = job;
      const label = modelLabel(model);
      try {
        const { record, transcript } = await runSample(task, model, sample);
        records.push(record);
        await appendFile(`${dir}/records.jsonl`, `${JSON.stringify(record)}\n`);
        await Bun.write(`${dir}/traces/${label.replaceAll("/", "_")}/${task.id}-${sample}.json`, JSON.stringify({ record, ...transcript }, null, 1));
        console.log(
          `[${++done}/${jobs.length}] ${label} ${task.id}#${sample}: score ${(record.score * 100).toFixed(1)}, ${(record.wallMs / 1000).toFixed(1)} s, $${record.costUsd.toFixed(4)}, ${record.steps} steps${record.finished ? "" : " (unfinished)"}${record.error ? ` error: ${record.error.slice(0, 120)}` : ""}`,
        );
      } catch (error) {
        console.error(`[${++done}/${jobs.length}] ${label} ${task.id}#${sample} crashed:`, error);
      }
    }
  }),
);

const summary = summarize(records);
const { version } = (await Bun.file(new URL("../package.json", import.meta.url)).json()) as { version: string };
const meta = {
  date: new Date().toISOString().slice(0, 10),
  version: version.replace(/\.0$/u, ""),
  samples: Math.max(...records.map((record) => record.sample)),
  models: summary.models,
};
await Bun.write(`${dir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
await Bun.write(`${dir}/meta.json`, `${JSON.stringify(meta, null, 2)}\n`);
await Bun.write(`${dir}/summary.md`, formatMarkdown(summary));
console.log(`\n${formatMarkdown(summary)}`);
