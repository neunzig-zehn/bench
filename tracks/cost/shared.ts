/**
 * What the cost track's tasks share: bilingual text, number formatting, JSON-schema and tool-result
 * helpers, a calculator and paged documents as tools, and the cost score.
 */
import { deviationScore, relativeDeviation, toNumber } from "../../src/score";
import type { Lang, Tool, ToolResult } from "../../src/types";

/** Commercial rounding to cents, half away from zero. */
export const round2 = (value: number) => (Math.sign(value) * Math.round(Math.abs(value) * 100 + 1e-7)) / 100;

/** The German or the English text, by language. */
export const pick = (lang: Lang) => (de: string, en: string) => (lang === "de" ? de : en);

/** A number written the language's way: 1.234,50 or 1,234.50. */
export const formatNumber = (lang: Lang, value: number, decimals = 2) =>
  value.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

export const ok = (output: unknown): ToolResult => ({ output });
export const refuse = (error: string): ToolResult => ({ output: { error }, refused: true });

/** Evaluates plain arithmetic, as an estimator's spreadsheet would. */
export const calculator = <State>(lang: Lang): Tool<State> => {
  const t = pick(lang);
  return {
    name: "calculate",
    description: t(
      "Rechnet einen arithmetischen Ausdruck aus: Zahlen mit Dezimalpunkt, + - * / und Klammern. Gibt das ungerundete Ergebnis zurück.",
      "Evaluates an arithmetic expression: numbers with a decimal point, + - * / and parentheses. Returns the unrounded result.",
    ),
    parameters: object({ expression: { type: "string" } }, ["expression"]),
    run: (args) => {
      const expression = String(args.expression ?? "");
      if (!/^[\d\s.+\-*/()]+$/u.test(expression)) return refuse(t("Nur Zahlen, + - * / und Klammern.", "Only numbers, + - * / and parentheses."));
      const value: unknown = Function(`"use strict"; return (${expression});`)();
      return typeof value === "number" && Number.isFinite(value) ? ok({ value }) : refuse(t("Kein endliches Ergebnis.", "No finite result."));
    },
  };
};

export type Doc = { id: string; title: string; pages: string[] };

/** Lists the documents and reads them one page at a time. */
export const documentTools = <State>(lang: Lang, docs: Doc[]): Tool<State>[] => {
  const t = pick(lang);
  return [
    {
      name: "list_documents",
      description: t("Listet die Unterlagen: ID, Titel, Seitenzahl.", "Lists the documents: id, title, number of pages."),
      parameters: object({}),
      run: () => ok(docs.map(({ id, title, pages }) => ({ id, title, pages: pages.length }))),
    },
    {
      name: "read_document",
      description: t("Gibt eine Seite einer Unterlage zurück.", "Returns one page of a document."),
      parameters: object({ documentId: { type: "string" }, page: { type: "integer", minimum: 1 } }, ["documentId", "page"]),
      run: (args) => {
        const doc = docs.find(({ id }) => id === args.documentId);
        if (!doc) return refuse(t(`Unbekannte Unterlage ${String(args.documentId)}`, `Unknown document ${String(args.documentId)}`));
        const page = Number(args.page ?? 1);
        const text = doc.pages[page - 1];
        if (text === undefined) return refuse(t(`Seite ${page} gibt es nicht; ${doc.pages.length} Seiten.`, `There is no page ${page}; ${doc.pages.length} pages.`));
        return ok({ documentId: doc.id, title: doc.title, page, pages: doc.pages.length, text });
      },
    },
  ];
};

/**
 * How close a cost is to the actual one, from 0 to 1: 1 within rounding (a cent, or 0.05 % of the
 * value), then falling with the log ratio to 0 at `factor`. A negative actual needs a negative
 * estimate. Strings with a German or English decimal are read as numbers.
 */
export const costScore = (estimate: unknown, actual: number, factor: number) => {
  const value = toNumber(estimate);
  if (value === undefined) return 0;
  if (Math.abs(value - actual) <= Math.max(0.01, Math.abs(actual) * 0.0005) + 1e-9) return 1;
  return actual < 0 ? deviationScore(-value, -actual, factor) : deviationScore(value, actual, factor);
};

/** The relative deviation in percent, capped at 100. */
export const deviationPct = (estimate: unknown, actual: number) => Math.min(1, relativeDeviation(toNumber(estimate), actual)) * 100;

/** An ordinal compared by its numbers only: "01.02", "1.2", and "Pos. 01.02" are the same. */
export const ordinalKey = (ordinal: unknown) =>
  (String(ordinal ?? "").match(/\d+/gu) ?? []).map((part) => String(Number(part))).join(".");

/** The values of an answer's `[{ key, value }]` list, by normalized key; a later entry wins. */
export const answerMap = (list: unknown, key: string, value: string, normalize: (key: unknown) => string) => {
  const map = new Map<string, unknown>();
  if (Array.isArray(list))
    for (const entry of list)
      if (entry && typeof entry === "object") map.set(normalize((entry as Record<string, unknown>)[key]), (entry as Record<string, unknown>)[value]);
  return map;
};
