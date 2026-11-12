/**
 * Supplier offer lines as JSON, from OCR text or scanned pages, graded field by field against the
 * offer's gold lines, and the net total they add up to.
 */
import { toNumber } from "../../src/score";
import type { Check, Grade, Lang } from "../../src/types";
import { byKey, canonicalUnit, close, object, percent, type Text } from "./shared";

export type GoldLine = {
  pos: string;
  articleNo: string;
  quantity: number;
  unit: Text;
  /** EUR net per unit after price unit, every discount and surcharge, and any correction. */
  unitPrice: number;
  /** The printed total; null for a discontinued line. */
  lineTotal: number | null;
  alternative: boolean;
  optional: boolean;
  discontinued: boolean;
  /** The printed total is graded only where no correction changes the line. */
  gradeTotal: boolean;
};

export const OFFER_LINES_SCHEMA = object({
  netTotal: { type: "number" },
  lines: {
    type: "array",
    items: object({
      pos: { type: "string" },
      articleNo: { type: "string" },
      description: { type: "string" },
      quantity: { type: "number" },
      unit: { type: "string" },
      unitPrice: { type: "number" },
      lineTotal: { type: ["number", "null"] },
      alternative: { type: "boolean" },
      optional: { type: "boolean" },
      discontinued: { type: "boolean" },
    }),
  },
});

export const OFFER_LINES_RULES: Record<Lang, string> = {
  de: `Erfasse jede Angebotsposition und reiche alle mit submit ein. Überspringe Abschnittsüberschriften, Überträge, Zwischensummen, Summen, Kopf- und Fußzeilen.
- Zahlen sind deutsch formatiert: „1.234,50“ ist 1234.50.
- pos: die Positionsnummer wie gedruckt, ohne Kennzeichen wie (A).
- description: die vollständige Bezeichnung; sie kann in der nächsten Zeile oder auf der nächsten Seite weitergehen.
- quantity und unit: Menge und Mengeneinheit (ME) wie gedruckt.
- unitPrice: EUR netto je eine ME, nach Preiseinheit, allen Rabatten und Zuschlägen und jeder Berichtigung, die für die Position gelten, auf 5 Nachkommastellen; auch bei entfallenen Positionen.
- lineTotal: der gedruckte Gesamtpreis (GP) als Zahl; null, wenn keiner gedruckt ist oder die Position entfällt.
- alternative, optional (Bedarfsposition) und discontinued (entfällt) kennzeichnen die Position.
- netTotal: die Nettosumme nach allen Korrekturen: Summe von quantity × unitPrice über alle Positionen, die zählen (nicht alternativ, nicht Bedarf, nicht entfallen), jede Position auf Cent gerundet.`,
  en: `Capture every line item of the offer and submit them all with submit. Skip section headings, carried-forward amounts, subtotals, totals, headers, and footers.
- Numbers use English formatting: "1,234.50" is 1234.50.
- pos: the item number as printed, without markers such as (A).
- description: the full description; it can continue on the next line or the next page.
- quantity and unit: quantity and unit of quantity as printed.
- unitPrice: EUR net per one unit of quantity, after the price unit, every discount and surcharge, and any correction that apply to the line, to 5 decimals; also for discontinued lines.
- lineTotal: the printed line total as a number; null if none is printed or the line is discontinued.
- alternative, optional (provisional item), and discontinued flag the line.
- netTotal: the net total after all corrections: the sum of quantity × unitPrice over all lines that count (not alternative, not provisional, not discontinued), each line rounded to cents.`,
};

const posKey = (value: unknown) =>
  String(value ?? "")
    .replace(/\s*\([AB]\)/u, "")
    .replace(/^(pos|item)\.?\s*/iu, "")
    .trim();

const round2 = (value: number) => Math.round(value * 100) / 100;

/** The net total: quantity × unit price over the lines that count, each rounded to cents. */
export const netTotalOf = (gold: readonly GoldLine[]) =>
  round2(gold.filter((line) => !line.alternative && !line.optional && !line.discontinued).reduce((sum, line) => sum + round2(line.quantity * line.unitPrice), 0));

/** Each gold line's fields, matched by item number, and the net total (weight 5, within 15 cents); any other line fails `no extra lines`. */
export const gradeOfferLines = (
  answer: { lines?: unknown; netTotal?: unknown } | undefined,
  gold: readonly GoldLine[],
  lang: Lang,
  extra: (line: GoldLine, actual: Record<string, unknown> | undefined) => Record<string, Check> = () => ({}),
): Grade => {
  const lines = byKey(answer?.lines, "pos", posKey);
  const checks: Record<string, Check> = {};
  let prices = 0;
  for (const expected of gold) {
    const actual = lines.get(expected.pos);
    const flags = actual !== undefined && (["alternative", "optional", "discontinued"] as const).every((flag) => Boolean(actual[flag]) === expected[flag]);
    const unitPrice = close(actual?.unitPrice, expected.unitPrice);
    if (unitPrice) prices++;
    Object.assign(checks, {
      [`pos ${expected.pos} article`]: String(actual?.articleNo ?? "").replace(/\s/gu, "") === expected.articleNo,
      [`pos ${expected.pos} quantity`]: close(actual?.quantity, expected.quantity),
      [`pos ${expected.pos} unit`]: actual !== undefined && canonicalUnit(actual.unit) === canonicalUnit(expected.unit[lang]),
      [`pos ${expected.pos} unit price`]: unitPrice,
      ...(expected.gradeTotal
        ? {
            [`pos ${expected.pos} line total`]:
              actual !== undefined && (expected.lineTotal === null ? actual.lineTotal === null || actual.lineTotal === undefined : close(actual.lineTotal, expected.lineTotal)),
          }
        : {}),
      [`pos ${expected.pos} flags`]: flags,
      ...extra(expected, actual),
    });
  }
  const known = new Set(gold.map(({ pos }) => pos));
  const extraLines = [...lines.keys()].filter((pos) => !known.has(pos)).length;
  checks["no extra lines"] = { score: lines.size > 0 && extraLines === 0 ? 1 : 0, weight: 2 };
  const netTotal = toNumber(answer?.netTotal);
  const actualTotal = netTotalOf(gold);
  checks["net total"] = { score: netTotal !== undefined && Math.abs(netTotal - actualTotal) <= 0.15 ? 1 : 0, weight: 5 };
  return {
    checks,
    metrics: {
      linesFound: gold.filter(({ pos }) => lines.has(pos)).length,
      extraLines,
      unitPriceAccuracyPct: percent(prices, gold.length),
      netTotalDeviationPct: netTotal === undefined ? 100 : Math.min(100, (Math.abs(netTotal - actualTotal) / actualTotal) * 100),
    },
  };
};

/** The answer a perfect extraction gives. */
export const referenceLines = (gold: readonly GoldLine[], lang: Lang, description: (line: GoldLine) => string) => ({
  netTotal: netTotalOf(gold),
  lines: gold.map((line) => ({
    pos: line.pos,
    articleNo: line.articleNo,
    description: description(line),
    quantity: line.quantity,
    unit: line.unit[lang],
    unitPrice: Math.round(line.unitPrice * 100_000) / 100_000,
    lineTotal: line.lineTotal,
    alternative: line.alternative,
    optional: line.optional,
    discontinued: line.discontinued,
  })),
});
