import { describe, expect, test } from "bun:test";

import { scoreOf } from "../../src/score";
import { LANGS } from "../../src/types";
import { changeOrderPricing } from "./change-order-pricing";
import { changeOrders, GOLD as CHANGE_GOLD } from "./fixtures/change-order";
import { GOLD as HISTORIC_GOLD, historicPrices, RECORDS } from "./fixtures/historic-prices";
import { supplierOffer } from "./fixtures/supplier-offer";
import { AVERAGE_WAGE, buildUp, GOLD as BUILD_GOLD, LABOUR_SURCHARGE, OFFER_TOTAL, SITE_OVERHEAD_TOTAL } from "./fixtures/unit-price-build-up";
import { historicPriceEstimate } from "./historic-price-estimate";
import { TASKS } from "./index";
import { calculator, costScore, ordinalKey } from "./shared";
import { supplierOfferPricing } from "./supplier-offer";
import { unitPriceBuildUp } from "./unit-price-build-up";

const GERMAN = /\b(und|der|die|das|mit|für|nicht|je|oder|auf)\b|ä|ö|ü|ß/u;
const ALLOWED_NAMES = /Müller|Krämer|Krüger|Düsseldorf|Großformat/gu;

describe("shared", () => {
  test("costScore is 1 within rounding, steep beyond, and reads strings", () => {
    expect(costScore(100.01, 100, 1.2)).toBe(1);
    expect(costScore(10_000.4, 10_000, 1.2)).toBe(1);
    expect(costScore(105, 100, 1.05)).toBeCloseTo(0, 6);
    expect(costScore(102, 100, 1.05)).toBeGreaterThan(0.5);
    expect(costScore(102, 100, 1.05)).toBeLessThan(0.7);
    expect(costScore("1.234,56", 1234.56, 1.2)).toBe(1);
    expect(costScore(undefined, 10, 1.2)).toBe(0);
  });
  test("costScore needs the sign of a negative actual", () => {
    expect(costScore(-500, -500, 1.2)).toBe(1);
    expect(costScore(500, -500, 1.2)).toBe(0);
    expect(costScore(-520, -500, 1.2)).toBeGreaterThan(0.7);
  });
  test("the calculator evaluates arithmetic and refuses anything else", () => {
    const tool = calculator<unknown>("en");
    expect(tool.run({ expression: "(1.5 + 2) * 4 / 7" }, undefined)).toEqual({ output: { value: 2 } });
    expect(tool.run({ expression: "process.exit(1)" }, undefined)).toMatchObject({ refused: true });
  });
  test("ordinals compare by their numbers", () => {
    expect(ordinalKey("01.02")).toBe(ordinalKey("Pos. 1.2"));
  });
});

describe("track", () => {
  test("four tasks, each in German and English", () => {
    expect(TASKS).toHaveLength(8);
    for (const task of TASKS) expect(task.id.endsWith(`-${task.lang}`)).toBe(true);
  });
  test("both languages share the reference answer", () => {
    for (const factory of [supplierOfferPricing, unitPriceBuildUp, historicPriceEstimate, changeOrderPricing])
      expect(factory("en").reference).toEqual(factory("de").reference);
  });
});

describe("supplier offer", () => {
  const [de, en] = LANGS.map((lang) => supplierOffer(lang));
  test("German and English share lines, prices, quantities, and gold", () => {
    expect(en!.OFFER_LINES.map(({ id, articleNo, price }) => [id, articleNo, price])).toEqual(de!.OFFER_LINES.map(({ id, articleNo, price }) => [id, articleNo, price]));
    expect(en!.ITEMS.map(({ id, quantity }) => [id, quantity])).toEqual(de!.ITEMS.map(({ id, quantity }) => [id, quantity]));
    expect(en!.GOLD).toEqual(de!.GOLD);
  });
  test("the erratum and metal surcharge price copper pipe 18 mm", () => {
    expect(de!.GOLD["it-0202"]).toEqual([{ lines: expect.any(Array), unitPrice: 11.91 }]);
  });
  test("the English offer and LV are free of German", () => {
    const texts = [...en!.OFFER_LINES.flatMap((line) => [line.text, line.notes ?? "", line.packaging ?? "", line.unit]), ...en!.ITEMS.flatMap((item) => [item.short, item.long, item.unit]), en!.CONDITIONS];
    for (const text of texts) expect(text.replace(ALLOWED_NAMES, "")).not.toMatch(GERMAN);
  });
  test("a price 5 % off scores 0 for its Item", () => {
    const task = supplierOfferPricing("de");
    const state = task.referenceState!();
    const written = state.prices["it-0201"]!;
    if (written.kind !== "price") throw new Error("expected a price");
    state.prices["it-0201"] = { ...written, unitPrice: written.unitPrice * 1.05 };
    expect(task.grade(task.reference, state).checks["02.01 bar + metal surcharge"]).toBeCloseTo(0, 6);
  });
});

describe("unit price build-up", () => {
  test("average wage ASL follows the guideline by hand", () => {
    const averageA = (24.3 + 4 * 22.15 + 17.6 + 0.25 * 28.4) / 6;
    expect(AVERAGE_WAGE).toBe(Math.round((averageA * 1.84 + 1.65) * 100) / 100);
    expect(AVERAGE_WAGE).toBe(43.85);
  });
  test("site overhead needs the construction period", () => {
    expect(SITE_OVERHEAD_TOTAL).toBe(1850 + 2 * 16 * 42 + 6 * 16 * 68 + 5 * 95 + 3 * 380);
  });
  test("item 01.01 by hand, with the insulation tier reached only with the foyer wall", () => {
    expect((420 + 160 + 95) / 7.2).toBeLessThan(100);
    expect((420 + 160 + 95 + 120) / 7.2).toBeGreaterThanOrEqual(100);
    const labour = (0.22 + 4 * 0.14 + 0.05 + 2 * 0.08) * 43.85 * (1 + LABOUR_SURCHARGE / 100);
    const material = (4.2 * (6.4 / 2.5) * 0.88 + 2 * 2.48 * 0.88 + 0.8 * 2.12 * 0.88 + 1 * (26.4 / 7.2) + 12 * 0.0098 * 0.88 + 26 * 0.0124 * 0.88 + 0.6 * 0.98 * 0.88) * 1.1;
    expect(BUILD_GOLD[0]!.unitPrice).toBe(Math.round((labour + material) * 100) / 100);
  });
  test("general overhead and risk and profit are shares of the offer total", () => {
    const base = BUILD_GOLD.filter(({ counts }) => counts).reduce((sum, { quantity, unitPrice }) => sum + quantity * unitPrice, 0);
    expect(OFFER_TOTAL).toBeCloseTo(base, 1);
    expect(LABOUR_SURCHARGE).toBeGreaterThan(30);
    expect(LABOUR_SURCHARGE).toBeLessThan(60);
  });
  test("the provisional item stays out of the offer total", () => {
    const provisional = BUILD_GOLD.find(({ counts }) => !counts)!;
    const all = BUILD_GOLD.reduce((sum, { quantity, unitPrice }) => sum + quantity * unitPrice, 0);
    expect(OFFER_TOTAL).toBeCloseTo(all - provisional.quantity * provisional.unitPrice, 2);
  });
  test("missing the height surcharge loses points on 01.06", () => {
    const task = unitPriceBuildUp("en");
    const wrong = { ...task.reference, unitPrices: task.reference.unitPrices.map((entry) => (entry.ordinal === "01.06" ? { ...entry, unitPrice: BUILD_GOLD[6]!.unitPrice } : entry)) };
    expect(scoreOf(task.grade(wrong, {}))).toBeLessThan(0.97);
  });
  test("both languages have the same documents; English is free of German", () => {
    const [de, en] = LANGS.map((lang) => buildUp(lang));
    expect(en!.docs.map(({ id, pages }) => [id, pages.length])).toEqual(de!.docs.map(({ id, pages }) => [id, pages.length]));
    for (const page of en!.docs.flatMap(({ pages }) => pages)) expect(page.replace(ALLOWED_NAMES, "")).not.toMatch(GERMAN);
  });
});

describe("historic price estimate", () => {
  test("every Item has five or more admissible records, outliers clear of the bound, and every kind of trap", () => {
    for (const gold of HISTORIC_GOLD) {
      expect(gold.eligible).toBeGreaterThanOrEqual(5);
      for (const price of gold.admitted) expect(Math.abs(Math.abs(price / gold.first - 1) - 0.2)).toBeGreaterThan(0.01);
    }
    expect(HISTORIC_GOLD.some((gold) => gold.eligible < gold.admitted.length)).toBe(true);
    for (const kind of ["gross", "other", "near", "old", "quantity", "changeOrder", "unit", "edge", "scope", "outlier"]) expect(RECORDS.some((record) => record.kind === kind)).toBe(true);
  });
  test("search finds every record of an Item by its first word", () => {
    for (const lang of LANGS) {
      const task = historicPriceEstimate(lang);
      const search = task.tools.find(({ name }) => name === "search_prices")!;
      const { records } = historicPrices(lang);
      for (const record of records) {
        const word = record.text.split(" ")[0]!;
        const hits = [];
        for (let page = 1; ; page++) {
          const { output } = search.run({ query: word, page }, {}) as { output: { pages: number; records: Array<{ id: string }> } };
          hits.push(...output.records.map(({ id }) => id));
          if (page >= output.pages) break;
        }
        expect(hits).toContain(record.id);
      }
    }
  });
  test("the rendered records and documents give the gold by the written rules", () => {
    const { items, records, docs } = historicPrices("en");
    const rows = (id: string) => docs.find((doc) => doc.id === id)!.pages[0]!.split("\n").map((line) => line.split("|").map((cell) => cell.trim()));
    const index = new Map(rows("BPI-2026").filter((cells) => /^Q\d\/\d{4}$/u.test(cells[1] ?? "")).map((cells) => [cells[1]!, [Number(cells[2]), Number(cells[3])]]));
    const factors = new Map(rows("RF-2026").filter((cells) => /^\d/u.test(cells[2] ?? "")).map((cells) => [cells[1]!, Number(cells[2])]));
    const quarter = (month: string) => `Q${Math.floor((Number(month.slice(5, 7)) - 1) / 3) + 1}/${month.slice(0, 4)}`;
    for (const item of items) {
      const series = ["Masonry", "Concrete and reinforced concrete"].includes(item.trade) ? 0 : 1;
      const prices = records
        .filter((record) => record.text === item.long && record.unit === item.unit && record.awarded >= "2022-07")
        .filter((record) => record.quantity >= item.quantity / 2 && record.quantity <= item.quantity * 2)
        .filter((record) => record.note === "" || record.note === "gross price incl. 19 % VAT")
        .map((record) => ((record.note ? record.unitPrice / 1.19 : record.unitPrice) * index.get("Q3/2026")![series]!) / index.get(quarter(record.awarded))![series]! * (0.94 / factors.get(record.region)!))
        .sort((a, b) => a - b);
      const median = (values: number[]) => {
        const middle = Math.floor(values.length / 2);
        return values.length % 2 ? values[middle]! : (values[middle - 1]! + values[middle]!) / 2;
      };
      const first = median(prices);
      const kept = prices.filter((price) => Math.abs(price / first - 1) <= 0.2);
      expect(HISTORIC_GOLD.find(({ ordinal }) => ordinal === item.ordinal)!.unitPrice).toBe(Math.round(median(kept) * 100) / 100);
    }
  });
  test("both languages show the same numbers", () => {
    const [de, en] = LANGS.map((lang) => historicPrices(lang).records.map(({ id, unit, quantity, unitPrice, awarded, region }) => [id, unit, quantity, unitPrice, awarded, region]));
    expect(en).toEqual(de!);
  });
  test("English documents are free of German", () => {
    for (const page of historicPrices("en").docs.flatMap(({ pages }) => pages)) expect(page.replace(ALLOWED_NAMES, "")).not.toMatch(GERMAN);
  });
});

describe("change order pricing", () => {
  test("N1 and N4 by hand", () => {
    const n1 = 1 * 41.2 * 1.25 + ((49.68 / 1.08) * 0.92 * 1.08 + 5.5 * 0.72 + 0.3 * 2.1) * 1.13;
    expect(CHANGE_GOLD[0]!.price).toBe(Math.round(Math.round(n1 * 100) * 0.97) / 100);
    const floor = 12.4 + 11.85 + 31.75 - 1.5 + 16.3 + 13.45 + 62.25;
    expect(CHANGE_GOLD[0]!.amount).toBeCloseTo(floor * CHANGE_GOLD[0]!.price - 140 * 85.6, 2);
    const calculated = 83.5;
    const executed = 40.38 - 1.78 + 41.25 + 27.9 + 44.1 + 28.15;
    const n4 = calculated + ((39.14 * 0.2 + 30.6 * 0.1) * (300 - executed)) / executed;
    expect(CHANGE_GOLD[3]!.price).toBe(Math.round(Math.round(n4 * 100) * 0.97) / 100);
    expect(CHANGE_GOLD[3]!.amount).toBeCloseTo(executed * CHANGE_GOLD[3]!.price - 300 * 81, 2);
  });
  test("the 2026 wage gives a wrong daywork rate", () => {
    const task = changeOrderPricing("de");
    const wrong = { changeOrders: task.reference.changeOrders.map((entry) => (entry.id === "N5" ? { ...entry, unitPrice: 53.24, amount: 851.84 } : entry)) };
    expect(task.grade(wrong, {}).checks["N5 amount"]).toBeLessThan(0.7);
  });
  test("quantities exactly on 110 % and 90 % keep the contract price", () => {
    const [n6, n7] = [CHANGE_GOLD[5]!, CHANGE_GOLD[6]!];
    expect(n6.amount).toBeCloseTo((231 - 210) * n6.price, 2);
    expect(n7.amount).toBeCloseTo((54 - 60) * n7.price, 2);
  });
  test("English documents are free of German", () => {
    for (const page of changeOrders("en").docs.flatMap(({ pages }) => pages)) expect(page.replace(ALLOWED_NAMES, "")).not.toMatch(GERMAN);
  });
});
