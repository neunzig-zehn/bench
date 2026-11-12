/**
 * A cost estimate from a database of awarded unit prices: the model searches past prices and
 * normalizes them by a written guideline. Traps: a near-miss specification and a different unit
 * that share the search words, award dates before the cutoff, quantities outside the band, gross
 * prices, change-order prices, scope notes, boundary dates and quantities, annual averages in the
 * index table, the price index of the right trade group and quarter, regional factors in both
 * directions, and two Items of the same work whose quantity bands select different records; the
 * estimate is the median, averaged for an even count. Graded per
 * unit price and on the total (weight 3): 1 within rounding, falling with the log deviation to 0 at
 * 15 % off.
 */
import { mean } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { GOLD, historicPrices, TOTAL } from "./fixtures/historic-prices";
import { answerMap, calculator, costScore, deviationPct, documentTools, object, ok, ordinalKey, pick, refuse } from "./shared";

type Answer = { unitPrices: Array<{ ordinal: string; unitPrice: number }>; total: number };

const FACTOR = 1.15;
const PAGE = 8;

const words = (query: string) =>
  query
    .toLowerCase()
    .split(/\s+/u)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);

export const historicPriceEstimate = (lang: Lang): Task<Record<string, never>, Answer> => {
  const t = pick(lang);
  const { items, records, docs } = historicPrices(lang);
  return {
    id: `cost-historic-price-estimate-${lang}`,
    track: "cost",
    lang,
    title: "Cost estimate from historic unit prices",
    description:
      "Estimates the unit prices and total of an 11-Item shell and finishing LV from a database of 130 awarded prices, normalized by a written guideline with a quarterly construction price index per trade group and regional factors. Traps: near-miss specifications (thickness, strength class, bed, wet abrasion class) and other units under the same search words, awards before the cutoff, quantities outside the 50–200 % band, records exactly on the date and quantity bounds, gross prices, change-order prices, notes that add or remove scope, annual averages beside the quarterly index values, the right index series and quarter, regional factors in both directions, two Items of the same work whose quantity bands admit different records, and the median of an even count. Graded per unit price and on the total (weight 3): 1 within rounding, falling with the log deviation to 0 at 15 % off.",
    system: t(
      `Du erstellst als Kalkulator eine Kostenschätzung aus der Preisdatenbank des Unternehmens. Die Positionen stehen im LV, die Vergleichspreise in der Datenbank, die Regeln in den Unterlagen; alles erreichst du nur über die Tools. Halte dich genau an die Kostenermittlungsrichtlinie. Rufe unabhängige Tools parallel auf und reiche zum Schluss alle Einheitspreise und die Gesamtkosten ein.`,
      `You are an estimator preparing a cost estimate from the company's price database. The Items are in the LV, the comparison prices in the database, the rules in the documents; you reach all of them only through the tools. Follow the cost estimating guideline exactly. Call independent tools in parallel, and finally submit every unit price and the total.`,
    ),
    prompt: t(
      "Schätze die Einheitspreise und die Gesamtkosten des LV „Neubau Bürogebäude Leipzig, Rohbau und Ausbau“ aus der Preisdatenbank.",
      'Estimate the unit prices and the total of the LV "New office building Leipzig, shell and finishing" from the price database.',
    ),
    init: () => ({}),
    tools: [
      {
        name: "list_items",
        description: t("Listet die LV-Positionen: Ordnungszahl, Kurztext, Gewerk, Menge, Einheit.", "Lists the LV Items: ordinal, short text, trade, quantity, unit."),
        parameters: object({}),
        run: () => ok(items.map(({ long: _long, ...item }) => item)),
      },
      {
        name: "get_item",
        description: t("Gibt eine Position mit Langtext zurück.", "Returns one Item with its long text."),
        parameters: object({ ordinal: { type: "string" } }, ["ordinal"]),
        run: (args) => {
          const item = items.find(({ ordinal }) => ordinalKey(ordinal) === ordinalKey(args.ordinal));
          return item ? ok(item) : refuse(t(`Unbekannte Position ${String(args.ordinal)}`, `Unknown item ${String(args.ordinal)}`));
        },
      },
      {
        name: "search_prices",
        description: t(
          `Durchsucht die Preisdatenbank: findet Datensätze, deren Leistungstext oder Gewerk alle Suchwörter enthält (auch als Wortteil). Gibt ${PAGE} Datensätze je Seite zurück: ID, Leistung, Gewerk, Einheit, Menge, EP, Vergabemonat, Region, Hinweis.`,
          `Searches the price database: finds records whose work text or trade contains every search word (also as part of a word). Returns ${PAGE} records per page: id, work, trade, unit, quantity, unit price, award month, region, note.`,
        ),
        parameters: object({ query: { type: "string" }, page: { type: "integer", minimum: 1 } }, ["query"]),
        run: (args) => {
          const wanted = words(String(args.query ?? ""));
          if (!wanted.length) return refuse(t("Leere Suche.", "Empty search."));
          const found = records.filter((record) => {
            const haystack = `${record.text} ${record.trade}`.toLowerCase();
            return wanted.every((word) => haystack.includes(word));
          });
          const pages = Math.max(1, Math.ceil(found.length / PAGE));
          const page = Math.min(pages, Math.max(1, Number(args.page ?? 1)));
          return ok({ total: found.length, page, pages, records: found.slice((page - 1) * PAGE, page * PAGE) });
        },
      },
      ...documentTools<Record<string, never>>(lang, docs),
      calculator(lang),
    ],
    answer: {
      description: t("Der Einheitspreis jeder Position in EUR netto und die Gesamtkosten netto in EUR.", "Every Item's unit price in EUR net and the net total in EUR."),
      schema: object(
        {
          unitPrices: { type: "array", items: object({ ordinal: { type: "string" }, unitPrice: { type: "number" } }, ["ordinal", "unitPrice"]) },
          total: { type: "number" },
        },
        ["unitPrices", "total"],
      ),
    },
    maxTurns: 50,
    grade: (answer) => {
      const prices = answerMap(answer?.unitPrices, "ordinal", "unitPrice", ordinalKey);
      const checks: Record<string, number | { score: number; weight: number }> = {};
      for (const { ordinal, key, unitPrice } of GOLD) checks[`${ordinal} ${key}`] = costScore(prices.get(ordinalKey(ordinal)), unitPrice, FACTOR);
      checks.total = { score: costScore(answer?.total, TOTAL, FACTOR), weight: 3 };
      return {
        checks,
        metrics: {
          unitPriceDeviationPct: mean(GOLD.map(({ ordinal, unitPrice }) => deviationPct(prices.get(ordinalKey(ordinal)), unitPrice))),
          totalDeviationPct: deviationPct(answer?.total, TOTAL),
        },
      };
    },
    reference: { unitPrices: GOLD.map(({ ordinal, unitPrice }) => ({ ordinal, unitPrice })), total: TOTAL },
  };
};
