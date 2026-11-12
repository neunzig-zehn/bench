/**
 * Symbol count per room: the model counts the new electrical devices of every room on the upper
 * floor's electrical plan, by legend code. Traps: look-alike symbols (single and double socket,
 * one-way and two-way switch, ceiling and emergency light, smoke alarm and motion detector),
 * existing devices shown in grey, multipliers such as 3× beside a symbol, the ground floor sheet
 * with the same legend, and lettering that is legible only when zoomed in. Graded per room: 1 when
 * every code is right, losing 1 / max(2, 25 % of the room's devices) per device miscounted.
 */
import { LANGS, type Lang, type Task } from "../../src/types";
import { toNumber } from "../../src/score";
import { pick } from "./answers";
import { CODES, FLOORS, deviceCounts } from "./building";
import { object, planTools, system, type PlanState } from "./tools";

type Answer = { rooms: Record<string, Partial<Record<string, number>>> };

const ROOMS = FLOORS.OG.rooms;
const TRUTH = Object.fromEntries(ROOMS.map((room) => [room.id, deviceCounts(room)]));

const task = (lang: Lang): Task<PlanState, Answer> => ({
  id: `plans-symbol-count-${lang}`,
  track: "plans",
  lang,
  title: "Device count per room from an electrical plan",
  description:
    "Counts the new electrical devices of all 11 rooms on the upper floor plan by legend code E1–E9. Traps: look-alike symbols, existing devices in grey, multipliers beside a symbol, a second floor sheet with the same legend, lettering legible only when zoomed. Graded per room: exact is 1, each device miscounted costs 1 / max(2, 25 % of the room's devices).",
  system: system(lang),
  prompt:
    lang === "de"
      ? "Projekt Lindenstraße 12: Zähle im Elektroplan des Obergeschosses je Raum die neu einzubauenden Geräte, getrennt nach Legendencode E1 bis E9. Gib alle Räume des Obergeschosses an; Codes ohne Gerät dürfen fehlen (zählen als 0)."
      : "Project Lindenstraße 12: on the upper floor's electrical plan, count the devices to be installed in each room, by legend code E1 to E9. Give every room of the upper floor; codes without a device may be left out (they count as 0).",
  init: () => ({ views: 0 }),
  tools: planTools(lang),
  answer: {
    description: lang === "de" ? "Stückzahlen je Raum (Raumnummer) und Legendencode." : "Counts per room (room number) and legend code.",
    schema: object(
      {
        rooms: object(
          Object.fromEntries(ROOMS.map((room) => [room.id, object(Object.fromEntries(CODES.map((code) => [code, { type: "integer", minimum: 0 }])))])),
          ROOMS.map((room) => room.id),
        ),
      },
      ["rooms"],
    ),
  },
  grade: (answer) => {
    const checks: Record<string, number> = {};
    let exactCells = 0;
    let miscounted = 0;
    for (const room of ROOMS) {
      const given = pick(answer?.rooms, room.id);
      const truth = TRUTH[room.id]!;
      let miss = 0;
      for (const code of CODES) {
        const value = toNumber(pick(given, code)) ?? 0;
        const error = Math.abs(value - truth[code]);
        miss += error;
        if (given && !error) exactCells++;
      }
      const devices = CODES.reduce((sum, code) => sum + truth[code], 0);
      checks[`room ${room.id}`] = given ? Math.max(0, 1 - miss / Math.max(2, devices * 0.25)) : 0;
      miscounted += given ? miss : devices;
    }
    return { checks, metrics: { exactCellsPct: (exactCells / (ROOMS.length * CODES.length)) * 100, miscounted } };
  },
  reference: { rooms: Object.fromEntries(ROOMS.map((room) => [room.id, Object.fromEntries(CODES.filter((code) => TRUTH[room.id]![code]).map((code) => [code, TRUTH[room.id]![code]]))])) },
});

export const symbolCount = LANGS.map(task);
