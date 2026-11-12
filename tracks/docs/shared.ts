/** Helpers the docs track's tasks share: bilingual text, tool results, schemas, and lenient field comparison. */
import { normalizeText, toNumber } from "../../src/score";
import type { Lang, ToolResult } from "../../src/types";

/** A text in both languages. */
export type Text = Record<Lang, string>;

export const ok = (output: unknown): ToolResult => ({ output });
export const refuse = (error: string): ToolResult => ({ output: { error }, refused: true });

export const object = (properties: Record<string, unknown>, required: string[] = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

/** A number as a document in that language prints it: `1.234,50` or `1,234.50`. */
export const formatNumber = (lang: Lang, value: number, digits = 2, minDigits = digits) =>
  value.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { minimumFractionDigits: minDigits, maximumFractionDigits: digits });

/** A page or line window argument, clamped to its range. */
export const integerArg = (value: unknown, fallback: number, min: number, max: number) => {
  const number = Math.trunc(toNumber(value) ?? fallback);
  return Math.min(max, Math.max(min, number));
};

/** A number within a relative tolerance (default 0.05 %), or half a cent, read leniently. */
export const close = (value: unknown, expected: number, relative = 0.0005) => {
  const number = toNumber(value);
  return number !== undefined && Math.abs(number - expected) <= Math.max(0.0051, Math.abs(expected) * relative);
};

const UNITS: Record<string, string[]> = {
  pcs: ["st", "stk", "stck", "stück", "stueck", "pcs", "pc", "piece", "pieces", "no", "nr", "ea", "each", "unit", "units"],
  m: ["m", "lfm", "lm", "metre", "meter", "metres", "meters"],
  m2: ["m2", "m²", "qm", "sqm", "sq m"],
  m3: ["m3", "m³", "cbm"],
  t: ["t", "to", "tonne", "tonnes", "ton"],
  kg: ["kg"],
  h: ["h", "std", "hr", "hrs", "hour", "hours", "stunde", "stunden"],
  wk: ["wo", "woche", "wochen", "wk", "wks", "week", "weeks"],
  ls: ["psch", "pausch", "pauschal", "ls", "lump sum", "lumpsum"],
  container: ["geb", "gebinde", "bkt", "bucket", "buckets", "pail", "container"],
  pack: ["pak", "paket", "pk", "pack", "packs", "package"],
};

/** A unit of measure reduced to one spelling across languages: `Stk`, `St.` and `pcs` are all `pcs`. */
export const canonicalUnit = (unit: unknown) => {
  const text = String(unit ?? "").toLowerCase().replace(/\./gu, "").replace(/\s+/gu, " ").trim();
  return Object.entries(UNITS).find(([, spellings]) => spellings.includes(text))?.[0] ?? text;
};

export const sameText = (actual: unknown, expected: string) => normalizeText(actual) === normalizeText(expected);

/** A record's entries keyed by one of its fields, for answers given as arrays of objects. */
export const byKey = (list: unknown, key: string, normalize: (value: unknown) => string = (value) => String(value ?? "").trim()) => {
  const map = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(list)) return map;
  for (const entry of list)
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      const id = normalize(record[key]);
      if (id && !map.has(id)) map.set(id, record);
    }
  return map;
};

/** The weighted share of passed checks, in percent, for a metric. */
export const percent = (passed: number, total: number) => (total ? (passed / total) * 100 : 0);
