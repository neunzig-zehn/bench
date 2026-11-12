/** What every Calc task shares: the calculate tool, schema and paging helpers, and exact grading. */
import { exact, toNumber } from "../../src/score";
import type { Lang, Tool } from "../../src/types";
import { evaluate } from "./calculator";

export const object = (properties: Record<string, unknown>, required: string[] = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

export const ok = (output: unknown) => ({ output });
export const refuse = (lang: Lang, error: string) => ({ output: localize(lang, { error }), refused: true });

const COMMON_DE: Record<string, string> = { total: "gesamt", rows: "zeilen", next: "weiter", error: "fehler", result: "ergebnis", expression: "ausdruck" };

/** A tool output with its keys translated for the German variant; `names` maps English keys to German. */
export const localize = (lang: Lang, value: unknown, names: Record<string, string> = {}): unknown => {
  if (lang === "en") return value;
  if (Array.isArray(value)) return value.map((entry) => localize(lang, entry, names));
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [names[key] ?? COMMON_DE[key] ?? key, localize(lang, entry, names)]));
  return value;
};

/** A number formatted for the language's documents: German or English decimals. */
export const fmt = (lang: Lang, value: number, decimals = 2) =>
  value.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** One page of rows for a paged list tool. */
export const page = <T>(rows: readonly T[], args: Record<string, unknown>, max: number) => {
  const offset = Math.max(0, Math.floor(Number(args.offset ?? 0)) || 0);
  const limit = Math.min(max, Math.max(1, Math.floor(Number(args.limit ?? max)) || max));
  return { total: rows.length, offset, rows: rows.slice(offset, offset + limit), next: offset + limit < rows.length ? offset + limit : null };
};

export const pageParameters = (max: number) =>
  object({ offset: { type: "integer", minimum: 0 }, limit: { type: "integer", minimum: 1, maximum: max } }, ["offset"]);

/** A submitted number equal to the expected one at the stated precision (`decimals` places). */
export const matches = (value: unknown, expected: number, decimals: number) => {
  const number = toNumber(value);
  return number !== undefined && exact(number, expected, 0.5 * 10 ** -decimals + 1e-9);
};

/** Entries of an answer's array field, keyed by one of their fields. */
export const byKey = (list: unknown, key: string) => {
  const entries = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(list)) return entries;
  for (const entry of list)
    if (entry && typeof entry === "object") entries.set(String((entry as Record<string, unknown>)[key] ?? "").trim().toUpperCase(), entry as Record<string, unknown>);
  return entries;
};

export const calculateTool = <State>(lang: Lang): Tool<State> => ({
  name: "calculate",
  description:
    lang === "de"
      ? "Rechnet einen arithmetischen Ausdruck exakt aus. Erlaubt: Zahlen mit Dezimalpunkt (3.5, nicht 3,5), + - * / (auch × ÷), Klammern, Potenzen mit ^ oder **, sqrt(x), abs(x), min(...), max(...), floor(x), ceil(x), round(x, Stellen) (kaufmännisch) und die Konstante pi. Gibt das Ergebnis auf 12 signifikante Stellen zurück."
      : "Evaluates an arithmetic expression exactly. Allowed: numbers with a decimal point (3.5), + - * / (also × ÷), parentheses, powers with ^ or **, sqrt(x), abs(x), min(...), max(...), floor(x), ceil(x), round(x, digits) (half away from zero) and the constant pi. Returns the result to 12 significant digits.",
  parameters: object({ expression: { type: "string" } }),
  run: (args) => {
    const expression = String(args.expression ?? "");
    try {
      return ok(localize(lang, { expression, result: evaluate(expression) }));
    } catch (error) {
      return refuse(lang, error instanceof Error ? error.message : String(error));
    }
  },
});
