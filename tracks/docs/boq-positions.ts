/**
 * A bill of quantities as JSON (titles and positions with OZ, short text, quantity, unit, kind, and
 * the base of each alternative), graded field by field against its gold positions. The GAEB and
 * the OCR tasks share it.
 */
import type { Check, Grade, Lang } from "../../src/types";
import { byKey, canonicalUnit, close, object, percent, sameText, type Text } from "./shared";

export const KINDS = ["normal", "base", "alternative", "optional_with_total", "optional_without_total", "lump_sum", "surcharge"] as const;
export type Kind = (typeof KINDS)[number];

export type GoldPosition = { oz: string; shortText: Text; quantity: number; unit: Text; kind: Kind; alternativeTo?: string };
export type GoldTitle = { oz: string; label: Text };

export type BoqAnswer = {
  titles: Array<{ oz: string; label: string }>;
  positions: Array<{ oz: string; shortText: string; quantity: number; unit: string; kind: Kind; alternativeTo?: string | null }>;
};

export const BOQ_SCHEMA = object({
  titles: { type: "array", items: object({ oz: { type: "string" }, label: { type: "string" } }) },
  positions: {
    type: "array",
    items: object(
      {
        oz: { type: "string" },
        shortText: { type: "string" },
        quantity: { type: "number" },
        unit: { type: "string" },
        kind: { type: "string", enum: KINDS },
        alternativeTo: { type: ["string", "null"] },
      },
      ["oz", "shortText", "quantity", "unit", "kind"],
    ),
  },
});

export const BOQ_FIELDS: Record<Lang, string> = {
  de: `Erfasse jeden Titel und Untertitel mit OZ und Bezeichnung und jede Position mit:
- oz: die vollständige Ordnungszahl, Teile mit Punkten getrennt (z. B. 01.02.0030),
- shortText: der Kurztext genau wie im LV,
- quantity: die Menge als Zahl, unit: die Mengeneinheit wie im LV,
- kind: normal, base (Grundposition einer Alternativgruppe), alternative (Alternativ-/Wahlposition), optional_with_total (Bedarfsposition mit Gesamtbetrag), optional_without_total (Bedarfsposition ohne Gesamtbetrag), lump_sum (Pauschalposition) oder surcharge (Zulageposition),
- alternativeTo: nur bei Alternativpositionen die OZ der Grundposition ihrer Alternativgruppe.
Positionen sind nur die Positionen des LV.`,
  en: `Capture every title and subtitle with its OZ and label, and every item with:
- oz: the full ordinal number (OZ), parts separated by dots (e.g. 01.02.0030),
- shortText: the short text exactly as in the BoQ,
- quantity: the quantity as a number, unit: the unit as in the BoQ,
- kind: normal, base (base item of an alternative group), alternative (alternative item), optional_with_total (provisional item with total), optional_without_total (provisional item without total), lump_sum (lump-sum item), or surcharge (extra-over item),
- alternativeTo: for alternative items only, the OZ of the base item of their alternative group.
Items are only the BoQ's items.`,
};

/** An OZ compared by its numeric parts: `01.02.0030`, `1.2.30` and `01.02.0030.` are the same. */
export const ozKey = (value: unknown) =>
  String(value ?? "")
    .split(/[^0-9]+/u)
    .filter(Boolean)
    .map((part) => String(Number(part)))
    .join(".");

/** Per position: kind, quantity, unit, short text, and the base of an alternative; per title its label (weight 0.5); extra positions (weight 3). */
export const gradeBoq = (answer: Partial<BoqAnswer> | undefined, titles: readonly GoldTitle[], gold: readonly GoldPosition[], lang: Lang): Grade => {
  const positions = byKey(answer?.positions, "oz", ozKey);
  const labels = byKey(answer?.titles, "oz", ozKey);
  const checks: Record<string, Check> = {};
  for (const expected of gold) {
    const actual = positions.get(ozKey(expected.oz));
    checks[`${expected.oz} kind`] = actual?.kind === expected.kind;
    checks[`${expected.oz} quantity`] = close(actual?.quantity, expected.quantity, 0.0001);
    checks[`${expected.oz} unit`] = actual !== undefined && canonicalUnit(actual.unit) === canonicalUnit(expected.unit[lang]);
    checks[`${expected.oz} short text`] = actual !== undefined && sameText(actual.shortText, expected.shortText[lang]);
    if (expected.alternativeTo) checks[`${expected.oz} alternative to`] = actual !== undefined && ozKey(actual.alternativeTo) === ozKey(expected.alternativeTo);
  }
  const fields = Object.values(checks);
  for (const title of titles) checks[`title ${title.oz}`] = { score: sameText(labels.get(ozKey(title.oz))?.label, title.label[lang]) ? 1 : 0, weight: 0.5 };
  const known = new Set(gold.map(({ oz }) => ozKey(oz)));
  const extra = [...positions.keys()].filter((oz) => !known.has(oz)).length;
  checks["no extra positions"] = { score: positions.size > 0 && extra === 0 ? 1 : 0, weight: 3 };
  return {
    checks,
    metrics: {
      positionsFound: gold.filter(({ oz }) => positions.has(ozKey(oz))).length,
      extraPositions: extra,
      fieldAccuracyPct: percent(fields.filter((check) => check === true).length, fields.length),
    },
  };
};

export const referenceBoq = (titles: readonly GoldTitle[], gold: readonly GoldPosition[], lang: Lang): BoqAnswer => ({
  titles: titles.map(({ oz, label }) => ({ oz, label: label[lang] })),
  positions: gold.map((position) => ({
    oz: position.oz,
    shortText: position.shortText[lang],
    quantity: position.quantity,
    unit: position.unit[lang],
    kind: position.kind,
    ...(position.alternativeTo ? { alternativeTo: position.alternativeTo } : {}),
  })),
});
