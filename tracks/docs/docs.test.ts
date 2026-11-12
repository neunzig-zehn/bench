import { describe, expect, test } from "bun:test";

import { scoreOf } from "../../src/score";
import type { Task } from "../../src/types";
import { isoDate } from "./contract-terms";
import { TERMS } from "./fixtures/contract";
import { VARIANTS } from "./fixtures/datasheet";
import { GOLD_POSITIONS, x83 } from "./fixtures/gaeb-lv";
import { GOLD_POSITIONS as LV_POSITIONS, lvPages } from "./fixtures/lv-ocr";
import { GOLD_LINES as OCR_LINES, offerPages } from "./fixtures/offer-ocr";
import { GOLD_LINES as SCAN_LINES, PAGES as SCAN_PAGES } from "./fixtures/offer-scan";
import { ozKey } from "./boq-positions";
import { TASKS } from "./index";
import { canonicalUnit } from "./shared";

const task = (id: string) => TASKS.find((entry) => entry.id === id)!;
const run = (entry: Task, name: string, args: Record<string, unknown>) => entry.tools.find((tool) => tool.name === name)!.run(args, entry.init());
const graded = (entry: Task, answer: unknown) => scoreOf(entry.grade(answer, entry.init()));

describe("every docs task", () => {
  test("exists in German and in English with the same base id", () => {
    const base = (lang: string) => TASKS.filter((entry) => entry.lang === lang).map((entry) => entry.id.slice(0, -3)).sort();
    expect(base("de")).toEqual(base("en"));
    expect(base("de").length).toBeGreaterThanOrEqual(4);
    for (const entry of TASKS) expect(entry.id.endsWith(`-${entry.lang}`)).toBe(true);
  });
  for (const entry of TASKS)
    test(`${entry.id}: the reference scores 1, no answer and an empty answer score 0`, () => {
      expect(graded(entry, entry.reference)).toBeCloseTo(1, 6);
      expect(graded(entry, undefined)).toBe(0);
      expect(graded(entry, {})).toBe(0);
    });
});

describe("shared", () => {
  test("units match across spellings and languages", () => {
    expect(canonicalUnit("Stk.")).toBe(canonicalUnit("pcs"));
    expect(canonicalUnit("m²")).toBe(canonicalUnit("m2"));
    expect(canonicalUnit("psch")).toBe(canonicalUnit("LS"));
    expect(canonicalUnit("Geb")).toBe(canonicalUnit("bkt"));
    expect(canonicalUnit("m")).not.toBe(canonicalUnit("m2"));
  });
});

describe("GAEB X83", () => {
  test("the file holds every position and both remarks, nested in titles", () => {
    for (const lang of ["de", "en"] as const) {
      const text = x83(lang).join("\n");
      expect(text.match(/<Item /gu)?.length).toBe(GOLD_POSITIONS.length);
      expect(text.match(/<Remark /gu)?.length).toBe(2);
      expect(text.match(/<BoQCtgy /gu)?.length).toBe(text.match(/<\/BoQCtgy>/gu)?.length);
      expect(text).toContain(lang === "de" ? "liefern &amp; einbauen" : "Supply &amp; fix");
    }
  });
  test("alternatives name their base, across subtitles", () => {
    expect(GOLD_POSITIONS.find(({ oz }) => oz === "03.02.0030")?.alternativeTo).toBe("03.01.0040");
    expect(GOLD_POSITIONS.filter(({ alternativeTo }) => alternativeTo === "04.01.0020").length).toBe(2);
  });
  test("OZ match by their numeric parts", () => {
    expect(ozKey("01.02.0030")).toBe(ozKey("1.2.30"));
    expect(ozKey("01.02.0030.")).toBe("1.2.30");
  });
  test("the file reads in windows of at most 120 lines", () => {
    const entry = task("docs-gaeb-lv-structure-de");
    const window = run(entry, "read_file", { path: "LV_300_Rohbau.X83", offset: 1, limit: 500 }) as { output: { to: number } };
    expect(window.output.to).toBe(120);
    expect((run(entry, "read_file", { path: "other.X83", offset: 1 }) as { refused?: boolean }).refused).toBe(true);
  });
  test("a remark taken for a position and a wrong kind cost points", () => {
    const entry = task("docs-gaeb-lv-structure-en");
    const reference = entry.reference as { positions: Array<Record<string, unknown>> };
    const withRemark = { ...reference, positions: [...reference.positions, { oz: "01.02.0005", shortText: "Note", quantity: 0, unit: "", kind: "normal" }] };
    expect(graded(entry, withRemark)).toBeLessThan(1);
    const wrongKind = { ...reference, positions: reference.positions.map((position) => (position.kind === "base" ? { ...position, kind: "normal" } : position)) };
    expect(graded(entry, wrongKind)).toBeLessThan(1);
  });
});

describe("supplier offers", () => {
  test("OCR gold prices apply price units, every discount, and the correction", () => {
    const price = (pos: string) => OCR_LINES.find((line) => line.pos === pos)!.unitPrice;
    expect(price("5")).toBeCloseTo(130.64, 6);
    expect(price("12")).toBeCloseTo(0.6498, 6);
    expect(price("18")).toBeCloseTo(5.5, 6);
    expect(price("22")).toBeCloseTo(12.144, 6);
    expect(price("12")).toBeCloseTo(0.6498, 6);
    expect(price("13")).toBeCloseTo(0.08 * 0.9 * 0.97, 6);
    expect(price("19")).toBeCloseTo(9.25 + 0.38, 6);
    expect(OCR_LINES.find((line) => line.pos === "9")!.lineTotal).toBeNull();
  });
  test("the OCR pages carry the continuation to page 2 in both languages", () => {
    expect(offerPages("de")[1]).toContain("Art. 4471), verchromt");
    expect(offerPages("en")[1]).toContain("art. 4471), chrome-plated");
    expect(offerPages("en")[3]).toContain("Correction to item 12");
  });
  test("an answer missing the section discount scores below 1", () => {
    const entry = task("docs-offer-ocr-lines-de");
    const reference = entry.reference as { lines: Array<Record<string, unknown>> };
    const answer = { lines: reference.lines.map((line) => (line.pos === "5" ? { ...line, unitPrice: 142 } : line)) };
    expect(graded(entry, answer)).toBeLessThan(1);
  });
  test("scan gold prices apply handwriting; the struck line is discontinued", () => {
    const line = (pos: string) => SCAN_LINES.find((entry) => entry.pos === pos)!;
    expect(line("6").unitPrice).toBeCloseTo(6.84, 6);
    expect(line("15").unitPrice).toBeCloseTo(3.476, 6);
    expect(line("1").unitPrice).toBeCloseTo(0.6890 * 0.85 + (43.2 * 720) / 100_000, 6);
    expect(line("4").unitPrice).toBeCloseTo(0.398 + (9.6 * 720) / 100_000, 6);
    expect(line("13").discontinued).toBe(true);
    expect(line("4").lineTotal).toBeCloseTo(119.4, 6);
    expect(line("23").unitPrice).toBeCloseTo(0.149 * 0.92, 6);
    expect(line("23").gradeTotal).toBe(false);
  });
  test("every scan page exists as overview and zoomed halves, in both languages and orientations", async () => {
    for (const lang of ["de", "en"] as const)
      for (let page = 1; page <= SCAN_PAGES; page++)
        for (const rotate of [0, 180]) {
          const views = await Promise.all(
            [undefined, "top", "bottom"].map((zoom) => run(task(`docs-offer-scan-lines-${lang}`), "view_page", { documentId: "angebot-e-2026-0447", page, rotate, zoom })),
          );
          for (const view of views) expect(view.images?.[0]).toStartWith("data:image/jpeg;base64,/9j/");
          expect(new Set(views.map((view) => view.images?.[0])).size).toBe(3);
        }
  });
});

describe("BoQ as OCR pages", () => {
  test("positions break across pages and every position, title, and marker is printed", () => {
    for (const lang of ["de", "en"] as const) {
      const pages = lvPages(lang);
      const text = pages.join("\n");
      for (const position of LV_POSITIONS) expect(text).toContain(`${position.oz}   ${position.shortText[lang]}`);
      const broken = pages.slice(1).filter((page) => /^-+\n\s+(Übertrag|Carried forward)[ .]+\.{10}\n\s{40,}\d/mu.test(page));
      expect(broken.length).toBeGreaterThan(0);
    }
  });
  test("OCR damage keeps the quantity resolvable", () => {
    expect(lvPages("de").join("\n")).toContain("96,750m2");
    expect(lvPages("en").join("\n")).toContain("1,120.50O m2");
  });
});

describe("data sheet", () => {
  test("gold fields follow the sheet's rules", () => {
    const [glass, highCri, wide] = VARIANTS;
    expect(Math.round((15200 * 1.03 * 0.98 * 0.96) / 100) * 100).toBe(wide!.luminousFluxLm);
    expect(Math.round(wide!.luminousFluxLm / wide!.systemPowerW)).toBe(wide!.efficacyLmPerW);
    expect(Math.round((22400 * 0.96) / 100) * 100).toBe(glass!.luminousFluxLm);
    expect(Math.round(glass!.luminousFluxLm / glass!.systemPowerW)).toBe(glass!.efficacyLmPerW);
    expect(Math.round((29300 * 0.86 * 0.97) / 100) * 100).toBe(highCri!.luminousFluxLm);
    expect(Math.round(highCri!.luminousFluxLm / highCri!.systemPowerW)).toBe(highCri!.efficacyLmPerW);
    expect(glass!.weightKg).toBeCloseTo(5.9 + 0.2 + 0.6, 6);
  });
  test("the table weight before the erratum and a missing certificate cost points", () => {
    const entry = task("docs-datasheet-fields-en");
    const answer = { variants: VARIANTS.map((variant, index) => (index === 0 ? { ...variant, weightKg: 6.4, certifications: ["CE", "UKCA", "ENEC"] } : variant)) };
    expect(graded(entry, answer)).toBeLessThan(1);
  });
});

describe("contract terms", () => {
  test("the binding period and the interim deadline follow from the documents' rules", () => {
    const holidays = new Set(["2027-03-26", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-17"]);
    const day = new Date("2027-03-01T12:00:00Z");
    for (let counted = 0; counted < 50; ) {
      day.setUTCDate(day.getUTCDate() + 1);
      if (day.getUTCDay() !== 0 && !holidays.has(day.toISOString().slice(0, 10))) counted++;
    }
    expect(day.toISOString().slice(0, 10)).toBe(TERMS.interimDeadline);
    const binding = new Date("2026-12-10T12:00:00Z");
    binding.setUTCDate(binding.getUTCDate() + 60);
    expect(binding.toISOString().slice(0, 10)).toBe(TERMS.bindingPeriodEnd);
  });
  test("dates read from ISO and German forms", () => {
    expect(isoDate("13.08.2027")).toBe("2027-08-13");
    expect(isoDate("2027-8-13")).toBe("2027-08-13");
    expect(isoDate("13 August 2027")).toBe("");
  });
  test("taking the lower-ranked ZVB penalty costs points", () => {
    const entry = task("docs-contract-terms-de");
    const reference = entry.reference as Record<string, unknown>;
    expect(graded(entry, { ...reference, penalty: { percentPerDay: 0.3, dayType: "calendar_day", capPercent: 10 } })).toBeLessThan(1);
  });
});
