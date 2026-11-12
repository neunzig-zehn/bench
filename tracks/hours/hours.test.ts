import { describe, expect, test } from "bun:test";

import { scoreOf } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { DRYWALL } from "./drywall-rules";
import { CATALOG as ELECTRICAL_CATALOG, heightFactor } from "./electrical-catalog";
import { ELECTRICAL } from "./electrical-new-build";
import { RENOVATION } from "./electrical-occupied-renovation";
import { HEATING } from "./heating-small-quantities";
import { TASKS } from "./index";
import { actualHours, booked, catalogOf, standardMinutes, type Answer, type Fixture } from "./kit";
import { PLUMBING } from "./plumbing-old-building";
import { VENTILATION } from "./ventilation-duct-surface";

const FIXTURES = [ELECTRICAL, PLUMBING, HEATING, DRYWALL, VENTILATION, RENOVATION] as Fixture<any, any>[];
const task = (slug: string, lang: Lang) => TASKS.find((candidate) => candidate.id === `hours-${slug}-${lang}`)! as Task<object, Answer>;
const run = (slug: string, lang: Lang, name: string, args: Record<string, unknown>) => task(slug, lang).tools.find((tool) => tool.name === name)!.run(args, {}) as { output: any; refused?: boolean };
const answer = (fixture: Fixture<any, any>, hours: (actual: number, index: number) => number): Answer => {
  const items = actualHours(fixture).map((actual, index) => ({ itemId: fixture.items[index]!.id, hours: hours(actual, index) }));
  return { items, totalHours: items.reduce((sum, item) => sum + item.hours, 0) };
};
const catalogOnly = (fixture: Fixture<any, any>) => {
  const catalog = catalogOf(fixture.catalog);
  return fixture.items.map((item) => item.lines.reduce((sum: number, line: { code: string; quantity: number }) => sum + standardMinutes(catalog(line.code), line.quantity), 0) / 60);
};

test("twelve tasks: six fixtures in German and English", () => {
  expect(TASKS).toHaveLength(12);
  for (const fixture of FIXTURES) for (const lang of ["de", "en"] as const) expect(task(fixture.slug, lang).lang).toBe(lang);
});

describe.each(FIXTURES.map((fixture) => [fixture.slug, fixture] as const))("%s", (slug, fixture) => {
  test("every Item and historic row resolves in the catalog and has both languages", () => {
    expect(new Set(fixture.items.map((item) => item.id)).size).toBe(fixture.items.length);
    for (const item of fixture.items) {
      expect(fixture.hours(item.lines, fixture.attrs)).toBeGreaterThan(0);
      for (const text of [item.short, item.long]) expect(text.de && text.en && text.de !== text.en).toBeTruthy();
    }
    for (const project of fixture.projects) for (const row of project.items) expect(fixture.hours(row.lines, project.attrs)).toBeGreaterThan(0);
  });

  test("every booked project total matches the hidden model within 1 %", () => {
    fixture.projects.forEach((project, index) => {
      const model = project.items.reduce((sum, row) => sum + fixture.hours(row.lines, project.attrs), 0);
      const total = booked(fixture, index).reduce((sum, hours) => sum + hours, 0);
      expect(Math.abs(total / model - 1)).toBeLessThan(0.01);
    });
  });

  test("bookings scatter, but by at most 6 % plus rounding", () => {
    fixture.projects.forEach((project, index) => {
      const bookings = booked(fixture, index);
      const exact = project.items.filter((row, i) => Math.abs(bookings[i]! - fixture.hours(row.lines, project.attrs)) < 0.05);
      expect(exact.length).toBeLessThan(project.items.length);
      project.items.forEach((row, i) => expect(Math.abs(bookings[i]! - fixture.hours(row.lines, project.attrs))).toBeLessThanOrEqual(0.12 * fixture.hours(row.lines, project.attrs) + 0.05));
    });
  });

  test("grading: the reference scores 1 in both languages, ±10 % about 0.75, nothing 0", () => {
    for (const lang of ["de", "en"] as const) {
      const current = task(slug, lang);
      expect(scoreOf(current.grade(current.reference, {}))).toBeCloseTo(1, 6);
      expect(scoreOf(current.grade(undefined, {}))).toBe(0);
      const over = scoreOf(current.grade(answer(fixture, (actual) => actual * 1.1), {}));
      expect(over).toBeGreaterThan(0.7);
      expect(over).toBeLessThan(0.8);
      expect(scoreOf(current.grade(answer(fixture, (actual) => actual * 1.5), {}))).toBeCloseTo(0, 6);
    }
    expect(task(slug, "de").reference).toEqual(task(slug, "en").reference);
  });

  test("grading reads ordinals without leading zeros and German decimal strings", () => {
    const current = task(slug, "de");
    const reference = current.reference;
    const loose = {
      items: reference.items.map((row) => ({ itemId: row.itemId.split(".").map(Number).join("."), hours: String(row.hours).replace(".", ",") as unknown as number })),
      totalHours: reference.totalHours,
    };
    expect(scoreOf(current.grade(loose, {}))).toBeCloseTo(1, 6);
  });

  test("tools page the LV and the history and refuse unknown ids", () => {
    const first = run(slug, "en", "list_items", { offset: 0 }).output;
    expect(first.items).toHaveLength(Math.min(10, fixture.items.length));
    expect(first.total).toBe(fixture.items.length);
    const project = run(slug, "de", "get_project", { projectId: fixture.projects[0]!.id, offset: 0 }).output;
    expect(project.items[0].actualHours).toBe(booked(fixture, 0)[0]);
    expect(run(slug, "en", "get_item", { itemId: "99.99" }).refused).toBe(true);
    expect(run(slug, "en", "get_project", { projectId: "P-0000" }).refused).toBe(true);
    expect(run(slug, "de", "read_site_description", {}).output.sections.length).toBe(fixture.site.length);
  });
});

test("hand-computed actual hours", () => {
  const pick = (fixture: Fixture<any, any>, id: string) => actualHours(fixture)[fixture.items.findIndex((item) => item.id === id)];
  expect(pick(ELECTRICAL, "01.02")).toBe(12.32);
  expect(pick(ELECTRICAL, "03.02")).toBe(4.48);
  expect(pick(ELECTRICAL, "03.04")).toBe(2.5);
  expect(pick(PLUMBING, "02.02")).toBe(4.2);
  expect(pick(PLUMBING, "04.03")).toBe(31.2);
  expect(pick(PLUMBING, "03.06")).toBe(25.68);
  expect(pick(HEATING, "01.01")).toBe(2.08);
  expect(pick(HEATING, "01.03")).toBe(19.42);
  expect(pick(HEATING, "01.07")).toBe(0.47);
  expect(pick(DRYWALL, "01.04")).toBe(114.05);
  expect(pick(DRYWALL, "02.06")).toBe(533.89);
  expect(pick(DRYWALL, "02.04")).toBe(47.82);
  expect(pick(VENTILATION, "01.01")).toBe(63.47);
  expect(pick(VENTILATION, "01.04")).toBe(45.36);
  expect(pick(RENOVATION, "01.04")).toBe(46.73);
  expect(pick(RENOVATION, "04.03")).toBe(5.76);
  expect(pick(RENOVATION, "05.04")).toBe(16);
});

test("plumbing history books its factors per building and kind of work", () => {
  const catalog = catalogOf(PLUMBING.catalog);
  const group = (code: string) => (["S-101", "S-102", "S-103", "S-104", "S-105", "S-170", "S-171", "S-172"].includes(code) ? "strip" : Number(code.slice(2)) < 140 ? "pipe" : "fit");
  const expected = { new: { strip: 1, pipe: 1, fit: 1 }, vacant: { strip: 1.4, pipe: 1.15, fit: 1 }, occupied: { strip: 1.55, pipe: 1.3, fit: 1.2 } } as const;
  PLUMBING.projects.forEach((project, index) => {
    const bookings = booked(PLUMBING, index);
    for (const kind of ["strip", "pipe", "fit"] as const) {
      const rows = project.items.map((row, i) => [row, bookings[i]!] as const).filter(([row]) => group(row.lines[0]!.code) === kind);
      if (!rows.length) continue;
      const standard = rows.reduce((sum, [row]) => sum + standardMinutes(catalog(row.lines[0]!.code), row.quantity) / 60, 0);
      const actual = rows.reduce((sum, [, hours]) => sum + hours, 0);
      expect(actual / standard).toBeCloseTo(expected[project.attrs.building as keyof typeof expected][kind], 2);
    }
  });
});

test("heating history shows 0.75 h per water-side Item and 0.33 h per dry Item over the catalog", () => {
  const catalog = catalogOf(HEATING.catalog);
  const residuals = { wet: [] as number[], dry: [] as number[] };
  HEATING.projects.forEach((project, index) =>
    project.items.forEach((row, i) => {
      const wet = row.lines.some((line) => catalog(line.code).text.en.endsWith("(water side)"));
      residuals[wet ? "wet" : "dry"].push(booked(HEATING, index)[i]! - row.lines.reduce((sum, line) => sum + standardMinutes(catalog(line.code), line.quantity), 0) / 60);
    }),
  );
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  expect(average(residuals.wet)).toBeCloseTo(0.75, 1);
  expect(average(residuals.dry)).toBeCloseTo(20 / 60, 1);
  expect(residuals.dry.length).toBeGreaterThanOrEqual(6);
});

test("renovation history books 1.00, 1.20, 1.25 and 1.50 for new or existing and vacant or occupied", () => {
  const catalog = catalogOf(ELECTRICAL_CATALOG);
  const ratios = RENOVATION.projects.map((project, index) => {
    const standard = project.items.reduce((sum, row) => sum + row.lines.reduce((s, line) => s + (standardMinutes(catalog(line.code), line.quantity) * heightFactor(line.height)) / 60, 0), 0);
    return Math.round((booked(RENOVATION, index).reduce((sum, hours) => sum + hours, 0) / standard) * 100) / 100;
  });
  expect(ratios.sort()).toEqual([1, 1.2, 1.25, 1.5]);
});

test("estimates from the catalog alone fall short where the task hides a factor", () => {
  const score = (fixture: Fixture<any, any>) => {
    const naive = catalogOnly(fixture);
    return scoreOf(task(fixture.slug, "en").grade(answer(fixture, (_, index) => naive[index]!), {}));
  };
  expect(score(PLUMBING)).toBeLessThan(0.7);
  expect(score(HEATING)).toBeLessThan(0.6);
  expect(score(DRYWALL)).toBeLessThan(0.85);
  expect(score(RENOVATION)).toBeLessThan(0.5);
});

test("drywall: trusting the published ×1.35 above 5 m over the bookings loses", () => {
  const trusting = answer(DRYWALL, (actual, index) => (DRYWALL.items[index]!.lines[0]!.height > 5 ? (actual * 1.35) / 1.2 : actual));
  expect(scoreOf(task(DRYWALL.slug, "en").grade(trusting, {}))).toBeLessThan(0.96);
});

test("catalog search finds entries by words in each language and by code", () => {
  const codes = (slug: string, lang: Lang, query: string) => run(slug, lang, "search_catalog", { query }).output.results.map((entry: { code: string }) => entry.code);
  expect(codes("electrical-new-build", "de", "Kabelrinne 200x60")[0]).toBe("E-120");
  expect(codes("electrical-new-build", "en", "cable tray 200x60")[0]).toBe("E-120");
  expect(codes("plumbing-old-building", "de", "Holzbalkendecke")).toContain("S-170");
  expect(codes("plumbing-old-building", "en", "timber-joist")).toContain("S-170");
  expect(codes("ventilation-duct-surface", "en", "L-10")).toEqual(["L-101", "L-102", "L-103"]);
  expect(run("electrical-new-build", "en", "search_catalog", { query: "NYM 3x1.5" }).output.results[0].unit).toBe("100 m");
});
