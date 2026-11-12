/**
 * Scaled takeoff from an old survey plan: net floor areas of the nine basement rooms, whose
 * interior dimensions are not given. The plan is a reduced, slightly rotated copy (96 %, 0.6°), so
 * the nominal 1:100 is wrong by 4 %: the model has to calibrate on the overall dimensions or the
 * copied scale bar (or use the axis grid on the heating plan of the same floor) and read wall
 * positions from zoomed crops. Traps: the copy's scale, partitions that do not line up with the
 * floors above, thin walls at 1:100, rooms whose depth is shared but whose widths all differ.
 * Graded per room by deviation (full within 2 %, 0 at 25 %).
 */
import { LANGS, type Lang, type Task } from "../../src/types";
import { mean, relativeDeviation, toNumber } from "../../src/score";
import { pick, round2 } from "./answers";
import { FLOORS, area } from "./building";
import { object, planTools, system, takeoffScore, type PlanState } from "./tools";

type Answer = { areas: Record<string, number> };

const ROOMS = FLOORS.UG.rooms;
const TRUTH = Object.fromEntries(ROOMS.map((room) => [room.id, area(room.poly)]));

const task = (lang: Lang): Task<PlanState, Answer> => ({
  id: `plans-survey-areas-${lang}`,
  track: "plans",
  lang,
  title: "Floor areas measured on an undimensioned survey plan",
  description:
    "Net floor areas of the nine basement rooms from an old survey plan that gives only the overall dimensions and was inserted as a 96 % copy: the model measures on the drawing, calibrating on the overall dimensions or the copied scale bar instead of the nominal 1:100. Traps: the copy's scale, partitions that do not line up with the floors above, thin walls at 1:100. Graded per room by deviation (full within 2 %, 0 at 25 %).",
  system: system(lang),
  prompt:
    lang === "de"
      ? "Projekt Lindenstraße 12, Untergeschoss: Ermittle die Netto-Raumfläche (lichte Maße) jedes Raums U.01 bis U.09 in m² auf 2 Nachkommastellen. Für das Untergeschoss gibt es nur ein Bestandsaufmaß; was nicht bemaßt ist, greifst du maßstäblich aus dem Plan ab."
      : "Project Lindenstraße 12, basement: determine the net floor area (clear dimensions) of every room U.01 to U.09 in m² to 2 decimals. The basement has only an as-built survey; whatever is not dimensioned you scale from the drawing.",
  init: () => ({ views: 0 }),
  tools: planTools(lang),
  answer: {
    description: lang === "de" ? "Netto-Raumfläche je Raum in m²." : "Net floor area per room in m².",
    schema: object({ areas: object(Object.fromEntries(ROOMS.map((room) => [room.id, { type: "number" }])), ROOMS.map((room) => room.id)) }, ["areas"]),
  },
  grade: (answer) => ({
    checks: Object.fromEntries(ROOMS.map((room) => [`room ${room.id}`, takeoffScore(pick(answer?.areas, room.id), TRUTH[room.id]!)])),
    metrics: { deviationPct: mean(ROOMS.map((room) => Math.min(1, relativeDeviation(toNumber(pick(answer?.areas, room.id)), TRUTH[room.id]!)))) * 100 },
  }),
  reference: { areas: Object.fromEntries(ROOMS.map((room) => [room.id, round2(TRUTH[room.id]!)])) },
});

export const surveyAreas = LANGS.map(task);
