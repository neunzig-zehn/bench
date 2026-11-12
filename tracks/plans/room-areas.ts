/**
 * Room areas and wall areas from an architectural floor plan and its sections: net floor area of
 * every ground-floor room from clear dimensions, and the paintable wall area of six rooms.
 * Traps: half-centimetre superscripts (8,55⁵), an L-shaped room, a store cut out of it, heights
 * that come only from the sections (a suspended ceiling at 2,55 below a 2,80 slab), the 2.5 m²
 * rule (a 1,63⁵/1,51 window is measured over, a 1,76/2,13⁵ door deducted, on both sides of the
 * wall, a corridor with an entrance door over 2.5 m²). Graded per room by deviation (full within 2 %,
 * 0 at 25 %); wall areas weigh 2.
 */
import { LANGS, type Lang, type Task } from "../../src/types";
import { mean, relativeDeviation } from "../../src/score";
import { pick, round2 } from "./answers";
import { FLOORS, area, wallArea } from "./building";
import { object, planTools, system, takeoffScore, type PlanState } from "./tools";

type Answer = { floorAreas: Record<string, number>; wallAreas: Record<string, number> };

const ROOMS = FLOORS.EG.rooms;
const WALL_ROOMS = ["0.01", "0.02", "0.03", "0.05", "0.10", "0.12"];
const FLOOR_TRUTH = Object.fromEntries(ROOMS.map((room) => [room.id, area(room.poly)]));
const WALL_TRUTH = Object.fromEntries(WALL_ROOMS.map((id) => [id, wallArea(FLOORS.EG, id)]));

const task = (lang: Lang): Task<PlanState, Answer> => ({
  id: `plans-room-areas-${lang}`,
  track: "plans",
  lang,
  title: "Floor and wall areas from a floor plan and sections",
  description:
    "Net floor area of all 12 ground-floor rooms from clear dimensions, and paintable wall areas of six rooms (perimeter × clear height from the sections, less openings over 2.5 m²). Traps: superscript half centimetres, an L-shaped room, a suspended ceiling, the 2.5 m² rule, doors counted on both sides. Graded by deviation per room (full within 2 %, 0 at 25 %), wall areas weigh 2.",
  system: system(lang),
  prompt:
    lang === "de"
      ? "Projekt Lindenstraße 12, Erdgeschoss: Ermittle (1) die Netto-Raumfläche jedes Raums aus den lichten Raummaßen und (2) für die Malerarbeiten die Wandflächen der Räume 0.01, 0.02, 0.03, 0.05, 0.10 und 0.12. Wandfläche = lichter Raumumfang × lichte Raumhöhe (Fertigfußboden bis Unterkante Decke bzw. Unterkante abgehängte Decke) abzüglich Öffnungen über 2,5 m² (Breite × Höhe laut Plan); Öffnungen bis 2,5 m² werden übermessen (VOB/C DIN 18363), Laibungen bleiben unberücksichtigt. Flächen in m² auf 2 Nachkommastellen."
      : "Project Lindenstraße 12, ground floor: determine (1) the net floor area of every room from its clear dimensions and (2) for the painting works, the wall areas of rooms 0.01, 0.02, 0.03, 0.05, 0.10 and 0.12. Wall area = clear room perimeter × clear room height (finished floor to the underside of the ceiling or of the suspended ceiling) less openings over 2.5 m² (width × height as drawn); openings up to 2.5 m² are measured over (VOB/C DIN 18363), reveals are ignored. Areas in m² to 2 decimals.",
  init: () => ({ views: 0 }),
  tools: planTools(lang),
  answer: {
    description: lang === "de" ? "Netto-Raumflächen aller Räume und Wandflächen der sechs Räume, in m²." : "Net floor areas of all rooms and wall areas of the six rooms, in m².",
    schema: object(
      {
        floorAreas: object(Object.fromEntries(ROOMS.map((room) => [room.id, { type: "number" }])), ROOMS.map((room) => room.id)),
        wallAreas: object(Object.fromEntries(WALL_ROOMS.map((id) => [id, { type: "number" }])), WALL_ROOMS),
      },
      ["floorAreas", "wallAreas"],
    ),
  },
  grade: (answer) => {
    const checks: Record<string, number | { score: number; weight: number }> = {};
    const floor: number[] = [];
    const wall: number[] = [];
    for (const room of ROOMS) {
      const value = pick(answer?.floorAreas, room.id);
      checks[`floor ${room.id}`] = takeoffScore(value, FLOOR_TRUTH[room.id]!);
      floor.push(Math.min(1, relativeDeviation(Number(value), FLOOR_TRUTH[room.id]!)));
    }
    for (const id of WALL_ROOMS) {
      const value = pick(answer?.wallAreas, id);
      checks[`walls ${id}`] = { score: takeoffScore(value, WALL_TRUTH[id]!), weight: 2 };
      wall.push(Math.min(1, relativeDeviation(Number(value), WALL_TRUTH[id]!)));
    }
    return { checks, metrics: { floorDeviationPct: mean(floor) * 100, wallDeviationPct: mean(wall) * 100 } };
  },
  reference: {
    floorAreas: Object.fromEntries(ROOMS.map((room) => [room.id, round2(FLOOR_TRUTH[room.id]!)])),
    wallAreas: Object.fromEntries(WALL_ROOMS.map((id) => [id, round2(WALL_TRUTH[id]!)])),
  },
});

export const roomAreas = LANGS.map(task);
