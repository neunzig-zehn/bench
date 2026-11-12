/**
 * A combined electrical takeoff for a small bill of quantities (LV) over two floors: device
 * totals from both electrical plans, and tray lengths including the riser, whose length needs
 * the tray heights from both plans and the upper floor level from the sections. Traps: everything
 * in the symbol and tray tasks, on two sheets, plus a riser measured between tray undersides
 * (+3,30 + 2,75 − 2,85) and positions read from the LV. Graded per position: counts lose 1 /
 * max(2, 25 %) per piece off, lengths by deviation (full within 2 %, 0 at 25 %, weight 2).
 */
import { LANGS, type Lang, type Task, type Tool } from "../../src/types";
import { mean, relativeDeviation, toNumber } from "../../src/score";
import { round2 } from "./answers";
import { FLOORS, deviceCounts, trayRiser, trayTakeoff, type Code } from "./building";
import { countScore, object, planTools, system, takeoffScore, type PlanState } from "./tools";

type Position = { ordinal: string; unit: { de: string; en: string }; text: { de: string; en: string }; code?: Code; tray?: "KT300" | "KT200" };

const POSITIONS: Position[] = [
  { ordinal: "01.01", code: "E1", unit: { de: "Stk", en: "pcs" }, text: { de: "Steckdose 1-fach (Legende E1), liefern und montieren", en: "Socket outlet, single (legend E1), supply and install" } },
  { ordinal: "01.02", code: "E2", unit: { de: "Stk", en: "pcs" }, text: { de: "Steckdose 2-fach (Legende E2), liefern und montieren", en: "Socket outlet, double (legend E2), supply and install" } },
  { ordinal: "01.03", code: "E5", unit: { de: "Stk", en: "pcs" }, text: { de: "Deckenleuchte (Legende E5), liefern und montieren", en: "Ceiling light (legend E5), supply and install" } },
  { ordinal: "01.04", code: "E7", unit: { de: "Stk", en: "pcs" }, text: { de: "Rauchwarnmelder (Legende E7), liefern und montieren", en: "Smoke alarm (legend E7), supply and install" } },
  { ordinal: "01.05", code: "E9", unit: { de: "Stk", en: "pcs" }, text: { de: "Datendose 2× RJ45 (Legende E9), liefern und montieren", en: "Data outlet 2× RJ45 (legend E9), supply and install" } },
  {
    ordinal: "02.01",
    tray: "KT300",
    unit: { de: "m", en: "m" },
    text: {
      de: "Kabeltrasse KT 300×60 einschl. Formteile: waagerechte Trassen in EG und OG sowie die Steigtrasse EG–OG, gemessen von UK Trasse EG bis UK Trasse OG",
      en: "Cable tray KT 300×60 incl. fittings: horizontal trays on the ground and upper floor, plus the riser between them, measured from the tray underside on the ground floor to the tray underside on the upper floor",
    },
  },
  { ordinal: "02.02", tray: "KT200", unit: { de: "m", en: "m" }, text: { de: "Kabeltrasse KT 200×60 einschl. Formteile, waagerecht in EG und OG", en: "Cable tray KT 200×60 incl. fittings, horizontal on the ground and upper floor" } },
];

const counts = [...FLOORS.EG.rooms, ...FLOORS.OG.rooms].map(deviceCounts);
const trays = [trayTakeoff(FLOORS.EG), trayTakeoff(FLOORS.OG)];
const TRUTH: Record<string, number> = Object.fromEntries(
  POSITIONS.map((position) => [
    position.ordinal,
    position.code
      ? counts.reduce((sum, room) => sum + room[position.code!], 0)
      : trays.reduce((sum, floor) => sum + floor[position.tray!], 0) + (position.tray === "KT300" ? trayRiser() : 0),
  ]),
);

const lvTool = (lang: Lang): Tool<PlanState> => ({
  name: "get_lv",
  description: lang === "de" ? "Liefert das Leistungsverzeichnis (LV) Elektro: Vorbemerkungen und Positionen mit Ordnungszahl, Text und Einheit." : "Returns the electrical bill of quantities (LV): preliminary notes and the Items with ordinal, text, and unit.",
  parameters: object({}),
  run: () => ({
    output: {
      title: lang === "de" ? "LV Elektro – Umbau Bürogebäude Lindenstraße 12" : "Electrical bill of quantities – conversion of office building Lindenstraße 12",
      notes:
        lang === "de"
          ? ["Mengen über Erd- und Obergeschoss nach den Elektroplänen.", "Bestand bleibt und wird nicht abgerechnet.", "Stückzahlen ganzzahlig, Längen in m auf 2 Nachkommastellen."]
          : ["Quantities over the ground and upper floor, from the electrical plans.", "Existing installations stay and are not billed.", "Counts as whole numbers, lengths in m to 2 decimals."],
      items: POSITIONS.map((position) => ({ ordinal: position.ordinal, text: position.text[lang], unit: position.unit[lang] })),
    },
  }),
});

const task = (lang: Lang): Task<PlanState, Record<string, number>> => ({
  id: `plans-combined-takeoff-${lang}`,
  track: "plans",
  lang,
  title: "Electrical bill of quantities over two floors",
  description:
    "Quantities for a 7-Item electrical LV over two floors: device totals from both electrical plans and tray lengths including the riser between the floors, measured between tray undersides from both plans' tray heights and the section's floor level. Traps: those of the symbol and tray tasks on two sheets, the riser arithmetic, the LV's measurement rules. Counts lose 1 / max(2, 25 %) per piece off; lengths by deviation (full within 2 %, 0 at 25 %, weight 2).",
  system: system(lang),
  prompt:
    lang === "de"
      ? "Projekt Lindenstraße 12: Ermittle die Mengen aller Positionen des Elektro-LVs (get_lv) aus den Plänen und gib sie je Ordnungszahl ab."
      : "Project Lindenstraße 12: determine the quantities of every Item in the electrical bill of quantities (get_lv) from the drawings and submit them by ordinal.",
  init: () => ({ views: 0 }),
  tools: [lvTool(lang), ...planTools(lang)],
  answer: {
    description: lang === "de" ? "Menge je LV-Position in ihrer Einheit." : "Quantity per LV Item in its unit.",
    schema: object(Object.fromEntries(POSITIONS.map((position) => [position.ordinal, { type: "number" }])), POSITIONS.map((position) => position.ordinal)),
  },
  maxTurns: 50,
  grade: (answer) => ({
    checks: Object.fromEntries(
      POSITIONS.map((position) => [
        `${position.ordinal} ${position.code ?? position.tray}`,
        position.code
          ? countScore(answer?.[position.ordinal], TRUTH[position.ordinal]!)
          : { score: takeoffScore(answer?.[position.ordinal], TRUTH[position.ordinal]!), weight: 2 },
      ]),
    ),
    metrics: {
      countErrors: POSITIONS.filter((position) => position.code).reduce((sum, position) => sum + Math.abs((toNumber(answer?.[position.ordinal]) ?? 0) - TRUTH[position.ordinal]!), 0),
      trayDeviationPct: mean(POSITIONS.filter((position) => position.tray).map((position) => Math.min(1, relativeDeviation(toNumber(answer?.[position.ordinal]), TRUTH[position.ordinal]!)))) * 100,
    },
  }),
  reference: Object.fromEntries(POSITIONS.map((position) => [position.ordinal, round2(TRUTH[position.ordinal]!)])),
});

export const combinedTakeoff = LANGS.map(task);
