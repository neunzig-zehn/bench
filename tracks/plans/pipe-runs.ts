/**
 * Heating pipe takeoff by DN across two sheets: the basement distribution (1:100 plan, dimensions
 * on the pipe axis) and the risers from the riser diagram (levels only). Traps: supply and return
 * share one dimension and both count, drinking-water lines on the same sheet with their own DN
 * and dimensions, DN changes at tees and reducers, an underlined dimension not drawn to scale,
 * riser lengths from signed levels (−0,45 to +3,60), the short boiler run in DN 50. Graded per DN
 * by deviation (full within 2 %, 0 at 25 %).
 */
import { LANGS, type Lang, type Task } from "../../src/types";
import { mean, relativeDeviation, toNumber } from "../../src/score";
import { round2 } from "./answers";
import { heatingTakeoff } from "./building";
import { object, planTools, system, takeoffScore, type PlanState } from "./tools";

const SIZES = ["DN20", "DN25", "DN32", "DN40", "DN50"] as const;
type Answer = Record<(typeof SIZES)[number], number>;

const TRUTH = heatingTakeoff();

const task = (lang: Lang): Task<PlanState, Answer> => ({
  id: `plans-pipe-runs-${lang}`,
  track: "plans",
  lang,
  title: "Heating pipe lengths by DN from a plan and a riser diagram",
  description:
    "Heating pipe length per DN, supply and return together: basement distribution from the 1:100 plan plus the risers from the riser diagram's levels. Traps: one dimension for two pipes, drinking-water lines with their own DN, DN changes, an underlined dimension not drawn to scale, signed levels, a short DN 50 run. Graded per DN by deviation (full within 2 %, 0 at 25 %).",
  system: system(lang),
  prompt:
    lang === "de"
      ? "Projekt Lindenstraße 12: Ermittle die Rohrlängen der Heizung je Nennweite in m, Vorlauf und Rücklauf zusammen: die Leitungen im Untergeschoss laut Grundriss und die Steigstränge laut Strangschema bis zu ihrem oberen Ende. Trinkwasserleitungen und die Anbindungen der Heizkreise (HK) zählen nicht. Längen auf Rohrachse, Formteile übermessen, auf 2 Nachkommastellen."
      : "Project Lindenstraße 12: determine the heating pipe lengths per nominal size in m, supply and return together: the basement pipes from the plan and the risers from the riser diagram up to their top end. Drinking-water pipes and the connections to the heating circuits (HK) do not count. Lengths along the pipe axis, fittings measured over, to 2 decimals.",
  init: () => ({ views: 0 }),
  tools: planTools(lang),
  answer: {
    description: lang === "de" ? "Rohrlänge Heizung (VL + RL) je DN in m." : "Heating pipe length (supply + return) per DN in m.",
    schema: object(Object.fromEntries(SIZES.map((size) => [size, { type: "number" }])), [...SIZES]),
  },
  grade: (answer) => ({
    checks: Object.fromEntries(SIZES.map((size) => [size, takeoffScore(answer?.[size], TRUTH[size]!)])),
    metrics: { deviationPct: mean(SIZES.map((size) => Math.min(1, relativeDeviation(toNumber(answer?.[size]), TRUTH[size]!)))) * 100 },
  }),
  reference: Object.fromEntries(SIZES.map((size) => [size, round2(TRUTH[size]!)])) as Answer,
});

export const pipeRuns = LANGS.map(task);
