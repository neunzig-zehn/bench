import { describe, expect, test } from "bun:test";

import { scoreOf } from "../../src/score";
import { CODES, FLOORS, area, deviceCounts, devicesOf, heatingTakeoff, perimeter, trayRiser, trayTakeoff, wallArea } from "./building";
import { MAX_PIXELS, dimension, zoneBox } from "./drawing";
import { SHEETS, sheetSvg } from "./sheets";
import { TASKS } from "./index";
import { countScore, planTools, takeoffScore } from "./tools";

const task = (id: string) => TASKS.find((candidate) => candidate.id === id)!;

describe("building data", () => {
  test("room areas and perimeters follow from the clear dimensions", () => {
    const rooms = Object.fromEntries(FLOORS.EG.rooms.map((room) => [room.id, room]));
    expect(area(rooms["0.10"]!.poly)).toBeCloseTo(8.555 * 2 + 5.94 * 2.5, 6);
    expect(perimeter(rooms["0.10"]!.poly)).toBeCloseTo(2 * (8.555 + 4.5), 6);
    expect(area(rooms["0.03"]!.poly)).toBeCloseTo(5.26 * 4.75, 6);
  });

  test("wall areas deduct only openings over 2.5 m², on both sides of a wall", () => {
    expect(wallArea(FLOORS.EG, "0.01")).toBeCloseTo(17.5 * 2.8 - 2.01 * 1.51, 6);
    expect(wallArea(FLOORS.EG, "0.03")).toBeCloseTo(20.02 * 2.55 - 2 * 2.01 * 1.51 - 1.76 * 2.135, 6);
    expect(wallArea(FLOORS.EG, "0.10")).toBeCloseTo(26.11 * 2.8 - 2 * 2.01 * 1.51 - 1.76 * 2.135, 6);
  });

  test("every opening sits in a wall of each room it lists", () => {
    for (const floor of Object.values(FLOORS))
      for (const opening of floor.openings)
        for (const id of opening.rooms) {
          const room = floor.rooms.find((candidate) => candidate.id === id)!;
          const axis = opening.along === "x" ? 0 : 1;
          const touches = room.poly.some((p, index) => {
            const q = room.poly[(index + 1) % room.poly.length]!;
            const across = opening.along === "x" ? 1 : 0;
            const onFace = p[across] === q[across] && opening.faces.includes(p[across]!);
            const [lo, hi] = [Math.min(p[axis]!, q[axis]!), Math.max(p[axis]!, q[axis]!)];
            return onFace && lo <= opening.at - opening.width / 2 + 1e-9 && hi >= opening.at + opening.width / 2 - 1e-9;
          });
          expect(`${floor.id} ${id} ${opening.at} ${touches}`).toBe(`${floor.id} ${id} ${opening.at} true`);
        }
  });

  test("device tokens: multipliers count, existing devices do not", () => {
    const room = { ...FLOORS.OG.rooms[0]!, devices: "E1 E2x3 E5*4 ~E1 ~E2x2" };
    expect(devicesOf(room)).toHaveLength(8);
    expect(deviceCounts(room)).toMatchObject({ E1: 1, E2: 3, E5: 4 });
  });

  test("tray takeoff: lengths per size, tees, horizontal bends, existing trays left out", () => {
    expect(trayTakeoff(FLOORS.EG)).toEqual({ KT300: expect.closeTo(12.075, 6), KT200: expect.closeTo(25.68, 6), tees: 4, bends: 3 });
    expect(trayTakeoff(FLOORS.OG)).toEqual({ KT300: expect.closeTo(4.705, 6), KT200: expect.closeTo(18.375, 6), tees: 2, bends: 1 });
    expect(trayRiser()).toBeCloseTo(3.3 + 2.75 - 2.85, 6);
  });

  test("heating takeoff: both pipes of every run, risers from their levels", () => {
    const total = heatingTakeoff();
    expect(total.DN50).toBeCloseTo(2 * 1.4, 6);
    expect(total.DN40).toBeCloseTo(2 * (3.8 + 2), 6);
    expect(total.DN25).toBeCloseTo(2 * (4.4 + 0.95 + 1.7 + 0.75 + 0.75), 6);
    expect(total.DN20).toBeCloseTo(2 * (6.8 + 0.85 + 0.95 + 3.3 + 3.3 + 4.05 + 0.75), 6);
  });
});

describe("drawing", () => {
  test("dimensions use centimetres below 1 m and a superscript 5 for half centimetres", () => {
    expect(dimension("de", 4.265)).toEqual({ main: "4,26", sup: "5" });
    expect(dimension("en", 8.555)).toEqual({ main: "8.55", sup: "5" });
    expect(dimension("de", 0.115)).toEqual({ main: "11", sup: "5" });
    expect(dimension("de", 0.3)).toEqual({ main: "30", sup: "" });
    expect(() => dimension("de", 4.263)).toThrow();
  });

  test("zones and zone ranges map to the frame grid", () => {
    expect(zoneBox("A1", "A1")).toMatchObject({ x: 20, y: 10 });
    const range = zoneBox("A1", "b2:d5")!;
    const cell = zoneBox("A1", "C3")!;
    expect(range.w).toBeCloseTo(cell.w * 4, 6);
    expect(range.h).toBeCloseTo(cell.h * 3, 6);
    expect(zoneBox("A3", "E1")).toBeUndefined();
    expect(zoneBox("A1", "nonsense")).toBeUndefined();
  });

  test("every device of a floor is drawn once, plus the legend's samples", () => {
    for (const [id, floor] of [["E-101", FLOORS.EG], ["E-102", FLOORS.OG]] as const) {
      const svg = sheetSvg(SHEETS.find((sheet) => sheet.id === id)!, "de");
      const symbols = floor.rooms.reduce((sum, room) => sum + devicesOf(room).length, 0);
      expect((svg.match(/<g transform/gu) ?? []).length).toBe(symbols + CODES.length + 4);
    }
  });

  test("positions drawn away from their dimension carry an underlined dimension", () => {
    for (const lang of ["de", "en"] as const) {
      expect(sheetSvg(SHEETS.find((sheet) => sheet.id === "E-101")!, lang)).toMatch(/text-decoration="underline"[^>]*>2[.,]02<tspan[^>]*>5</u);
      expect(sheetSvg(SHEETS.find((sheet) => sheet.id === "H-101")!, lang)).toMatch(/text-decoration="underline"[^>]*>75</u);
      expect((sheetSvg(SHEETS.find((sheet) => sheet.id === "E-102")!, lang).match(/underline/gu) ?? []).length).toBe(0);
    }
  });

  test("the view tool renders every sheet in both languages within the pixel limit", async () => {
    for (const lang of ["de", "en"] as const) {
      const view = planTools(lang).find((tool) => tool.name === "view")!;
      for (const sheet of SHEETS) {
        const result = await view.run({ sheet: sheet.id, zoom: 20 }, { views: 0 });
        const [w, h] = String((result.output as { pixels: string }).pixels).split("×").map(Number);
        expect(Math.max(w!, h!)).toBeLessThanOrEqual(MAX_PIXELS);
        expect(result.images?.[0]).toStartWith("data:image/png;base64,");
      }
    }
  });
});

describe("grading", () => {
  test("takeoff scores are full within 2 % and zero from 25 %", () => {
    expect(takeoffScore(101.9, 100)).toBe(1);
    expect(takeoffScore("98,5", 100)).toBe(1);
    expect(takeoffScore(113.5, 100)).toBeCloseTo(0.5, 6);
    expect(takeoffScore(75, 100)).toBe(0);
    expect(takeoffScore(undefined, 100)).toBe(0);
  });

  test("count scores lose per piece, relative to the count", () => {
    expect(countScore(40, 40)).toBe(1);
    expect(countScore(39, 40)).toBeCloseTo(0.9, 6);
    expect(countScore(5, 4)).toBeCloseTo(0.5, 6);
    expect(countScore(undefined, 4)).toBe(0);
  });

  test("symbol count: a double socket read as single costs that room two devices", () => {
    const { reference, grade } = task("plans-symbol-count-de");
    const answer = structuredClone(reference);
    answer.rooms["1.04"].E2 -= 1;
    answer.rooms["1.04"].E1 += 1;
    const room = grade(answer, { views: 0 }).checks["room 1.04"] as number;
    expect(room).toBeCloseTo(1 - 2 / 2.5, 6);
  });

  test("symbol count: counting existing devices and ignoring multipliers fails", () => {
    const { grade } = task("plans-symbol-count-en");
    const naive = Object.fromEntries(
      FLOORS.OG.rooms.map((room) => [room.id, Object.fromEntries(CODES.map((code) => [code, devicesOf(room).filter((device) => device.code === code).length]))]),
    );
    expect(scoreOf(grade({ rooms: naive }, { views: 0 }))).toBeLessThan(0.75);
  });

  test("room areas: the 2.5 m² rule and the suspended ceiling matter", () => {
    const { reference, grade } = task("plans-room-areas-de");
    const slab = structuredClone(reference);
    slab.wallAreas["0.03"] = 20.02 * 2.8 - 2 * 2.01 * 1.51 - 1.76 * 2.135;
    expect((grade(slab, { views: 0 }).checks["walls 0.03"] as { score: number }).score).toBeLessThan(1);
    const deductAll = structuredClone(reference);
    deductAll.wallAreas["0.01"] = 49 - 2.01 * 1.51 - 1.26 * 1.51 - 0.885 * 2.01;
    expect((grade(deductAll, { views: 0 }).checks["walls 0.01"] as { score: number }).score).toBeLessThan(1);
  });

  test("cable tray: counting the existing tray or the drawn length of the underlined run loses", () => {
    const { reference, grade } = task("plans-cable-tray-en");
    expect(scoreOf(grade({ ...reference, KT200: reference.KT200 + 2.8 }, { views: 0 }))).toBeLessThan(1);
    expect(scoreOf(grade({ ...reference, KT200: reference.KT200 - 0.85 }, { views: 0 }))).toBeLessThan(1);
  });

  test("pipe runs: one pipe instead of supply and return halves the score", () => {
    const { reference, grade } = task("plans-pipe-runs-de");
    const single = Object.fromEntries(Object.entries(reference).map(([dn, length]) => [dn, (length as number) / 2]));
    expect(scoreOf(grade(single, { views: 0 }))).toBe(0);
  });

  test("combined takeoff: leaving out the riser costs the KT 300 Item", () => {
    const { reference, grade } = task("plans-combined-takeoff-en");
    const checks = grade({ ...reference, "02.01": reference["02.01"] - 3.2 }, { views: 0 }).checks;
    expect((checks["02.01 KT300"] as { score: number }).score).toBeLessThan(0.5);
  });

  test("German and English variants share data, ids, and grading", () => {
    for (const de of TASKS.filter((candidate) => candidate.lang === "de")) {
      const en = task(de.id.replace(/-de$/u, "-en"));
      expect(en.reference).toEqual(de.reference);
      expect(en.answer.schema).toEqual(de.answer.schema);
      expect(en.tools.map((tool) => tool.name)).toEqual(de.tools.map((tool) => tool.name));
      expect(en.prompt).not.toEqual(de.prompt);
    }
  });
});
