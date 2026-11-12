import { describe, expect, test } from "bun:test";

import { scoreOf } from "../../src/score";
import { evaluate, roundHalfUp } from "./calculator";
import * as tray from "./fixtures/cable-tray";
import * as feeder from "./fixtures/feeder";
import * as heating from "./fixtures/heating-load";
import * as offer from "./fixtures/offer-total";
import * as paint from "./fixtures/paint-takeoff";
import * as cutting from "./fixtures/pipe-cutting";
import { TASKS } from "./index";
import { matches } from "./shared";

/** Distance of a value from the nearest rounding boundary at `decimals`, in units of the last digit. */
const margin = (value: number, decimals: number) => {
  const scaled = Math.abs(value) * 10 ** decimals;
  return Math.abs(scaled - Math.floor(scaled) - 0.5);
};

describe("calculator", () => {
  test("evaluates arithmetic with precedence, powers, functions and constants", () => {
    expect(evaluate("1 + 2 * 3")).toBe(7);
    expect(evaluate("-2^2")).toBe(-4);
    expect(evaluate("2 ** 3 ** 2")).toBe(512);
    expect(evaluate("(1 + 2) × 3 ÷ 4")).toBe(2.25);
    expect(evaluate("0.1 + 0.2")).toBe(0.3);
    expect(evaluate("pi / 4 * 11.4^2")).toBeCloseTo(102.0703, 4);
    expect(evaluate("sqrt(3) * 400 * 0.9")).toBeCloseTo(623.538, 3);
    expect(evaluate("round(1.005, 2) + round(-2.5) + min(3, 1, 2) + max(1, 4) + ceil(1.2) + floor(1.8) + abs(-1)")).toBe(1.01 - 3 + 1 + 4 + 2 + 1 + 1);
  });
  test("rejects anything that is not arithmetic", () => {
    for (const expression of ["", "2 +", "(1", "1 / 0", "sqrt(-1)", "process.exit()", "alert(1)", "1; 2", "3,5 + 1", "round(1, 2, 3)"])
      expect(() => evaluate(expression)).toThrow();
  });
  test("rounds half away from zero", () => {
    expect(roundHalfUp(2.675, 2)).toBe(2.68);
    expect(roundHalfUp(-0.125, 2)).toBe(-0.13);
    expect(roundHalfUp(32.05, 1)).toBe(32.1);
  });
});

test("matches reads numbers at the stated precision", () => {
  expect(matches(32.1, 32.1, 1)).toBe(true);
  expect(matches("32,1", 32.1, 1)).toBe(true);
  expect(matches(32.2, 32.1, 1)).toBe(false);
  expect(matches(undefined, 0, 0)).toBe(false);
});

describe("ground truth sits clear of rounding boundaries", () => {
  test("cable tray", () => {
    for (const route of tray.ROUTES) {
      const raw = tray.solve(route);
      expect(margin(raw.crossSection, 0)).toBeGreaterThan(0.1);
      expect(margin(raw.fillPercent, 1)).toBeGreaterThan(0.1);
    }
  });
  test("feeder", () => {
    const raw = feeder.solve();
    expect(margin(raw.demandKw, 2)).toBeGreaterThan(0.05);
    expect(margin(raw.current, 1)).toBeGreaterThan(0.1);
    expect(margin(raw.drop, 2)).toBeGreaterThan(0.1);
  });
  test("heating load", () => {
    for (const room of heating.ROOMS) expect(margin(heating.heatLoad(room), 0)).toBeGreaterThan(0.1);
  });
  test("paint take-off", () => {
    for (const room of paint.ROOMS) expect(margin(paint.paintArea(room), 2)).toBeGreaterThan(0.1);
  });
});

describe("every trap changes the answer", () => {
  test("cable tray", () => {
    const [kr1, kr2, kr3] = tray.ROUTES as [tray.Route, tray.Route, tray.Route];
    const gold = (route: tray.Route) => tray.solve(route).tray;
    expect([gold(kr1), gold(kr2), gold(kr3)]).toEqual(["KR 85.200", "KR 60.200", "KR 85.300"]);
    const laidOn = (route: tray.Route) => tray.CABLES.filter((cable) => cable.route.includes(route.id) && cable.status !== "cancelled" && cable.status !== "removed");
    expect(tray.solve(kr2, laidOn(kr2)).tray).not.toBe(gold(kr2));
    expect(tray.solve({ ...kr1, reserve: 1.3 }).tray).not.toBe(gold(kr1));
    expect(tray.solve({ ...kr2, reserve: 1 }).tray).not.toBe(gold(kr2));
    expect(tray.solve(kr2, tray.powerCables("KR-2").map((cable) => ({ ...cable, count: 1 }))).tray).not.toBe(gold(kr2));
    expect(tray.solve({ ...kr2, sideHeights: [60, 85] }).tray).not.toBe(gold(kr2));
    expect(tray.solve(kr3, tray.powerCables("KR-3").filter((cable) => cable.status !== "existing")).tray).not.toBe(gold(kr3));
    expect(tray.solve(kr2, tray.powerCables("KR-2").map(({ note: _note, ...cable }) => cable)).crossSection).toBeLessThan(tray.solve(kr2).crossSection);
    const withRemoved = tray.CABLES.filter((cable) => cable.route.includes("KR-3") && cable.status !== "cancelled" && !/E30|J-Y|CAT/u.test(cable.type));
    expect(tray.solve(kr3, withRemoved).crossSection).toBeGreaterThan(tray.solve(kr3).crossSection);
  });
  test("feeder", () => {
    const gold = feeder.solve();
    expect(gold.ampacityOnly).toBeLessThan(gold.section);
    expect(feeder.solve(feeder.CONSUMERS.map(({ status: _status, ...consumer }) => consumer)).current).toBeGreaterThan(gold.current + 10);
    expect(feeder.solve(feeder.CONSUMERS.map((consumer) => (consumer.status === "spare" ? { ...consumer, status: undefined } : consumer))).demandKw).not.toBeCloseTo(gold.demandKw, 2);
    const cooking = feeder.CONSUMERS.filter((consumer) => consumer.group === "cooking" && !consumer.status);
    expect(feeder.cookingFactor(cooking.length)).not.toBe(feeder.cookingFactor(cooking.reduce((sum, consumer) => sum + consumer.quantity, 0)));
    expect(feeder.groupingFactor(5)).toBe(feeder.GROUPING_FACTORS[6]!);
  });
  test("heating load", () => {
    for (const room of heating.ROOMS.filter((candidate) => candidate.openings.length))
      expect(Math.round(heating.heatLoad(room, { deductOpenings: false }))).not.toBe(heating.GOLD.rooms[room.id]);
    for (const room of heating.ROOMS.filter((candidate) => candidate.walls.some((wall) => wall.adjacent === "outside")))
      expect(Math.round(heating.heatLoad(room, { thermalBridge: false }))).not.toBe(heating.GOLD.rooms[room.id]);
    for (const room of heating.ROOMS.filter((candidate) => candidate.type in heating.EXTRACT))
      expect(Math.round(heating.heatLoad(room, { extract: false }))).not.toBe(heating.GOLD.rooms[room.id]);
    expect(heating.GOLD.total).toBe(Object.values(heating.GOLD.rooms).reduce((sum, load) => sum + load, 0));
  });
  test("paint take-off", () => {
    const differs = (options: paint.Options) => paint.ROOMS.some((room) => roundHalfUp(paint.paintArea(room, options), 2) !== paint.GOLD.rooms[room.id]);
    for (const options of [{ ceiling: false }, { reveals: false }, { inclusive: false }, { tiles: false }]) expect(differs(options)).toBe(true);
  });
  test("offer total", () => {
    expect(offer.POSITIONS).toHaveLength(123);
    expect(offer.GOLD.net).toBeGreaterThan(offer.THRESHOLD);
    expect(offer.GOLD.net - offer.THRESHOLD).toBeLessThan(5000);
    expect(offer.GOLD.gross).toBeCloseTo(offer.GOLD.afterDiscount + offer.GOLD.vat, 2);
    expect(offer.ORIGINAL_0103).not.toBe(72.5);
    expect(offer.ORIGINAL_0201).not.toBe(118);
  });
});

describe("pipe cutting", () => {
  const firstFitDecreasing = (lengths: number[]) => {
    const bars: number[] = [];
    for (const length of [...lengths].sort((a, b) => b - a)) {
      const index = bars.findIndex((used) => used + length + cutting.KERF <= cutting.BAR);
      if (index < 0) bars.push(length + cutting.KERF);
      else bars[index]! += length + cutting.KERF;
    }
    return bars.length;
  };
  test("the optimum is the lower bound, and first-fit decreasing misses it", () => {
    for (const dn of cutting.DIAMETERS) {
      const lengths = cutting.required(dn);
      expect(Math.ceil(lengths.reduce((sum, length) => sum + length + cutting.KERF, 0) / cutting.BAR)).toBe(cutting.OPTIMUM[dn]!);
      expect(firstFitDecreasing(lengths)).toBeGreaterThan(cutting.OPTIMUM[dn]!);
      for (const bar of cutting.PLAN[dn]!) expect(bar.reduce((sum, length) => sum + length + cutting.KERF, 0)).toBeLessThanOrEqual(cutting.BAR);
      expect(cutting.PLAN[dn]!.flat().sort()).toEqual([...lengths].sort());
    }
  });
  test("a plan that repeats, misses or overfills is invalid; counting the cancelled riser fails", () => {
    const candidate = task("calc-pipe-cutting-en");
    const reference = candidate.reference;
    const [first, ...rest] = reference.plans[0].bars;
    const repeated = { ...reference, plans: [{ ...reference.plans[0], bars: [first, first, ...rest] }, reference.plans[1]] };
    expect(candidate.grade(repeated, {}).checks["DN 15 valid plan"]).toEqual({ score: 0, weight: 2 });
    const merged = { ...reference, plans: [{ ...reference.plans[0], bars: [{ pieceIds: [...first.pieceIds, ...rest[0].pieceIds] }, ...rest.slice(1)] }, reference.plans[1]] };
    expect(candidate.grade(merged, {}).checks["DN 15 valid plan"]).toEqual({ score: 0, weight: 2 });
    const cancelled = cutting.PIECES.find((piece) => piece.strand === "ST-5" && piece.dn === 22)!.id;
    const withCancelled = { ...reference, plans: [reference.plans[0], { ...reference.plans[1], bars: [...reference.plans[1].bars, { pieceIds: [cancelled] }] }] };
    expect(candidate.grade(withCancelled, {}).checks["DN 22 valid plan"]).toEqual({ score: 0, weight: 2 });
    const split = { ...reference, plans: [{ ...reference.plans[0], bars: [{ pieceIds: first.pieceIds.slice(0, 1) }, { pieceIds: first.pieceIds.slice(1) }, ...rest] }, reference.plans[1]] };
    const grade = candidate.grade(split, {});
    expect(grade.checks["DN 15 valid plan"]).toEqual({ score: 1, weight: 2 });
    expect(grade.checks["DN 15 optimal bar count"]).toEqual({ score: 0, weight: 3 });
    expect(grade.metrics?.extraBars).toBe(1);
  });
});

describe("graders", () => {
  const task = (id: string) => TASKS.find((candidate) => candidate.id === id)!;
  test("every task exists in German and English with the same reference", () => {
    const base = (lang: string) => TASKS.filter((candidate) => candidate.lang === lang).map((candidate) => candidate.id.slice(0, -3));
    expect(base("de")).toEqual(base("en"));
    for (const de of TASKS.filter((candidate) => candidate.lang === "de")) expect(task(`${de.id.slice(0, -3)}-en`).reference).toEqual(de.reference);
  });
  test("references grade 1, a missing answer 0", () => {
    for (const candidate of TASKS) {
      expect(scoreOf(candidate.grade(candidate.reference, candidate.init()))).toBe(1);
      expect(scoreOf(candidate.grade(undefined, candidate.init()))).toBe(0);
    }
  });
  test("cable tray: German decimals and a differently spaced tray name still count", () => {
    const candidate = task("calc-cable-tray-de");
    const routes = candidate.reference.routes.map((route: Record<string, unknown>) => ({
      ...route,
      route: String(route.route).toLowerCase(),
      tray: String(route.tray).replace(" ", ""),
      fillRatioPercent: String(route.fillRatioPercent).replace(".", ","),
    }));
    expect(scoreOf(candidate.grade({ routes }, {}))).toBe(1);
    expect(scoreOf(candidate.grade({ routes: routes.slice(1) }, {}))).toBeCloseTo(2 / 3, 6);
  });
  test("feeder: an answer sized on ampacity alone loses the section and the voltage drop", () => {
    const candidate = task("calc-feeder-sizing-en");
    const grade = candidate.grade({ ...candidate.reference, crossSectionMm2: 120, voltageDropPercent: 1.63 }, {});
    expect(grade.checks["cross-section"]).toEqual({ score: 0, weight: 3 });
    expect(scoreOf(grade)).toBeCloseTo(6 / 11, 6);
  });
  test("heating load: room ids match regardless of case, a wrong room costs one check", () => {
    const candidate = task("calc-heating-load-en");
    const rooms = candidate.reference.rooms.map((room: { roomId: string; heatLoadW: number }) => ({ ...room, roomId: room.roomId.toLowerCase() }));
    expect(scoreOf(candidate.grade({ ...candidate.reference, rooms }, {}))).toBe(1);
    rooms[4] = { ...rooms[4], heatLoadW: rooms[4].heatLoadW + 1 };
    expect(scoreOf(candidate.grade({ ...candidate.reference, rooms }, {}))).toBeCloseTo(9 / 10, 6);
  });
  test("offer total: counting an alternative item fails that item only", () => {
    const candidate = task("calc-offer-total-de");
    const excludedPositions = candidate.reference.excludedPositions.filter((ordinal: string) => ordinal !== "01.10");
    const grade = candidate.grade({ ...candidate.reference, excludedPositions }, {});
    expect(grade.checks["01.10 excluded"]).toBe(false);
    expect(grade.checks["other items counted"]).toBe(true);
    const extra = candidate.grade({ ...candidate.reference, excludedPositions: [...candidate.reference.excludedPositions, "01.01"] }, {});
    expect(extra.checks["other items counted"]).toBe(false);
  });
});

describe("tools", () => {
  test("German tools answer with German keys and texts, English with English", async () => {
    const de = await task("calc-feeder-sizing-de").tools.find((tool) => tool.name === "list_consumers")!.run({ offset: 0 }, {});
    const en = await task("calc-feeder-sizing-en").tools.find((tool) => tool.name === "list_consumers")!.run({ offset: 0 }, {});
    expect(JSON.stringify(de.output)).toContain("zeilen");
    expect(JSON.stringify(de.output)).toContain("Kombidämpfer");
    expect(JSON.stringify(en.output)).toContain("Combi steamer");
  });
  test("pages cover every row exactly once", async () => {
    const list = task("calc-offer-total-en").tools.find((tool) => tool.name === "list_positions")!;
    const seen: string[] = [];
    for (let offset: number | null = 0; offset !== null; ) {
      const output = (await list.run({ offset, limit: 15 }, {})).output as { rows: Array<{ ordinal: string }>; next: number | null };
      seen.push(...output.rows.map((row) => row.ordinal));
      offset = output.next;
    }
    expect(seen).toEqual(offer.POSITIONS.map((position) => position.ordinal));
  });
  test("the calculate tool refuses bad input instead of throwing", async () => {
    const calculate = task("calc-paint-takeoff-en").tools.find((tool) => tool.name === "calculate")!;
    expect((await calculate.run({ expression: "2 * (3 + 4)" }, {})).output).toEqual({ expression: "2 * (3 + 4)", result: 14 });
    expect((await calculate.run({ expression: "require('fs')" }, {})).refused).toBe(true);
  });
  test("the cable catalog finds a type written with a German decimal comma", async () => {
    const search = task("calc-cable-tray-de").tools.find((tool) => tool.name === "search_cable_catalog")!;
    const output = (await search.run({ query: "NYM-J 5x2,5" }, {})).output as { zeilen: Array<{ typ: string }> };
    expect(output.zeilen[0]!.typ).toBe("NYM-J 5x2.5");
  });
});

const task = (id: string) => TASKS.find((candidate) => candidate.id === id)!;
