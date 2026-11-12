# The Last 10 · Die Letzten 10

A multi-step benchmark for language models in construction estimating, by [90/10](https://9010.berlin).
90 % of estimating is routine; the last 10 % decide whether an offer wins and earns money. This
benchmark measures how well models handle that last 10 %. Results: **[bench.9010.berlin](https://bench.9010.berlin)**.

Version 0.1.

## Tracks

| Track | What it measures | Metric |
| --- | --- | --- |
| [Docs](tracks/docs) | Parsing tenders, bills of quantities (LV), specs, data sheets | Extracted fields vs. ground truth |
| [Plans](tracks/plans) | Reading drawings: routes, dimensions, symbols, quantities | Takeoff vs. a verified measurement |
| [Calc](tracks/calc) | Deterministic maths: fill ratio, loads, quantities, sums | Exact answer |
| [Hours](tracks/hours) | Labour time estimation per item | Deviation from actual hours |
| [Cost](tracks/cost) | Unit prices and total cost estimation | Deviation from actual cost |
| [Dialog](tracks/dialog) | User interaction: clarifying questions, flagging missing info | Questions asked and issues flagged vs. the task's hidden facts |

Each track's README lists its tasks, their traps, and how they are graded.

## How it works

- **Multi-step.** Every task starts from a short brief. The model reaches the data only through
  tools (paged documents, search, drawing views, a simulated colleague) and ends by calling
  `submit`. The harness ([src/agent.ts](src/agent.ts)) runs that loop over OpenRouter.
- **German and English.** Every task exists as `-de` and `-en` with the same data and grader;
  documents, prompts, and tool output are fully translated.
- **Synthetic ground truth.** Tasks are generated or hand-built, so the right answer is known by
  construction. No customer data. Every task's reference answer grades 1 ([src/tasks.test.ts](src/tasks.test.ts)).
- **Deterministic grading.** No LLM judge. Each task returns weighted checks from 0 to 1; deviation
  tracks use a log-ratio curve, so being off by a factor counts the same over and under.
- **What a run reports** per model and reasoning level: the score (0–100, the mean over tracks of
  the mean over tasks), the average time per task (wall time of one full task), and the average
  cost per task (OpenRouter's billed `usage.cost`, including cache reads and writes and every
  retry the provider billed), plus steps and cache-hit rate.

## Run it

Needs [Bun](https://bun.sh) and an `OPENROUTER_API_KEY`.

```sh
bun install
bun test                                  # graders and references, no model calls
bun bench --list                          # every task
bun bench --models openai/gpt-6.1-terra:low,openai/gpt-6.1-terra:high --samples 1
bun bench --models google/gemini-4-hydrogen:medium --tracks plans,dialog --lang de
bun report results/<run>                  # rebuild summary.md / summary.json from records
```

A model is an OpenRouter id, optionally with `:<effort>` (`none`, `minimal`, `low`, `medium`,
`high`, `xhigh`). A run writes `results/<run>/records.jsonl` (one line per sample),
`summary.md`, `summary.json`, `meta.json`, and transcripts under `traces/` (not committed).
Running again into the same `--out` resumes and skips samples already recorded.

## Site

[`web/`](web) is a TanStack Start app on a Cloudflare Worker (`bench`) at bench.9010.berlin. It
reads `results/latest/{summary,meta}.json` at build time. To publish a run, copy its
`summary.json` and `meta.json` to `results/latest/`, then `cd web && bun install && bun run deploy`
(needs `CLOUDFLARE_API_TOKEN`).

## Known limits of 0.1

- One sample per task in the published run, so single slips move task scores by several points.
- Docs and Calc are saturated: strong models reach 100 on every task. They still compare time and cost.
- Tasks are public, so future models may have seen them.

## License

[MIT](LICENSE), covering the harness, tasks, and results.
