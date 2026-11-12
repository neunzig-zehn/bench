/**
 * Cable tray takeoff: the new trays on the ground floor's electrical plan, length per tray size
 * from the dimensions along the route, plus the tees and horizontal 90° bends the route forms.
 * Traps: the main run changes size at two tees, an existing tray in grey, a run whose underlined
 * dimension is not drawn to scale, the vertical riser that does not count, dimensions spread over
 * the whole sheet. Graded by deviation per size (full within 2 %, 0 at 25 %, weight 2 each) and
 * exact fitting counts.
 */
import { LANGS, type Lang, type Task } from "../../src/types";
import { relativeDeviation, toNumber } from "../../src/score";
import { round2 } from "./answers";
import { FLOORS, trayTakeoff } from "./building";
import { object, planTools, system, takeoffScore, type PlanState } from "./tools";

type Answer = { KT300: number; KT200: number; tees: number; bends: number };

const TRUTH = trayTakeoff(FLOORS.EG);

const task = (lang: Lang): Task<PlanState, Answer> => ({
  id: `plans-cable-tray-${lang}`,
  track: "plans",
  lang,
  title: "Cable tray lengths and fittings from an electrical plan",
  description:
    "Length per tray size of the new ground-floor cable trays from the dimensions along the route, and the number of tees and horizontal 90° bends. Traps: size changes on the main run, an existing tray in grey, an underlined dimension not drawn to scale, the vertical riser, dimensions spread over the sheet. Graded by deviation per size (full within 2 %, 0 at 25 %, weight 2) and exact fitting counts.",
  system: system(lang),
  prompt:
    lang === "de"
      ? "Projekt Lindenstraße 12, Elektroplan Erdgeschoss: Ermittle für die neuen Kabeltrassen die Länge je Trassengröße (KT 300×60 und KT 200×60) in m sowie die Anzahl der T-Stücke und der waagerechten 90°-Bögen. Nur waagerechte Trassen im EG; die Steigtrasse ins OG zählt weder als Länge noch als Bogen."
      : "Project Lindenstraße 12, ground-floor electrical plan: for the new cable trays, determine the length per tray size (KT 300×60 and KT 200×60) in m and the number of tees and of horizontal 90° bends. Horizontal trays on the ground floor only; the riser to the upper floor counts neither as length nor as a bend.",
  init: () => ({ views: 0 }),
  tools: planTools(lang),
  answer: {
    description: lang === "de" ? "Trassenlängen in m (2 Nachkommastellen) und Anzahl der Formteile." : "Tray lengths in m (2 decimals) and the number of fittings.",
    schema: object(
      { KT300: { type: "number" }, KT200: { type: "number" }, tees: { type: "integer", minimum: 0 }, bends: { type: "integer", minimum: 0 } },
      ["KT300", "KT200", "tees", "bends"],
    ),
  },
  grade: (answer) => ({
    checks: {
      "KT 300": { score: takeoffScore(answer?.KT300, TRUTH.KT300), weight: 2 },
      "KT 200": { score: takeoffScore(answer?.KT200, TRUTH.KT200), weight: 2 },
      tees: toNumber(answer?.tees) === TRUTH.tees,
      bends: toNumber(answer?.bends) === TRUTH.bends,
    },
    metrics: {
      kt300DeviationPct: Math.min(1, relativeDeviation(toNumber(answer?.KT300), TRUTH.KT300)) * 100,
      kt200DeviationPct: Math.min(1, relativeDeviation(toNumber(answer?.KT200), TRUTH.KT200)) * 100,
    },
  }),
  reference: { KT300: round2(TRUTH.KT300), KT200: round2(TRUTH.KT200), tees: TRUTH.tees, bends: TRUTH.bends },
});

export const cableTray = LANGS.map(task);
