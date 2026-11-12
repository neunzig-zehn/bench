/**
 * Technical fields of three order codes from a six-page product data sheet, read through page and
 * search tools. Traps: decoding the order code, luminous flux derived from a base value with
 * light colour, optics, and protective-glass factors and a rounding rule, efficacy from the
 * derived flux, dimensions printed in cm but asked in mm, height and IP/IK changed by an option,
 * weight from a base value plus option surcharges and an erratum in the revision history, a
 * temperature limit and a lifetime that differ for one power class, a temperature limit for one
 * combination of options, and certifications that
 * depend on the driver (a test report that is no certificate). Graded per variant and field with
 * tolerances (flux 0.3 %, efficacy 1 lm/W, weight 0.05 kg, dimensions 0.5 mm) and exact sets.
 */
import { toNumber } from "../../src/score";
import type { Check, Lang, Task, Tool } from "../../src/types";
import { CERTIFICATIONS, PAGES, VARIANTS, type Variant } from "./fixtures/datasheet";
import { byKey, integerArg, object, ok, percent, refuse } from "./shared";

type Answer = { variants: Array<Partial<Variant>> };

const COPY = {
  de: {
    system: `Du liest technische Daten aus Herstellerdatenblättern für die Ausschreibungsprüfung, mit den Werkzeugen.

Erfasse für jede genannte Ausführung (Bestellschlüssel) genau ihre Werte, nach den Regeln des Datenblatts und seinem neuesten Stand:
- systemPowerW (W), luminousFluxLm (lm), efficacyLmPerW (lm/W), colorTemperatureK (K), criMin (Mindest-Ra), beamAngleDeg (Grad),
- dimming: none, dali2 oder 1-10v,
- diameterMm und heightMm: Gehäusedurchmesser und Höhe ohne Montagebügel in mm, weightKg (kg),
- ipRating (z. B. IP54), ikRating (z. B. IK06), protectionClass (I, II oder III),
- ambientMinC und ambientMaxC: zulässige Umgebungstemperatur in °C, lifetimeL80H: Lebensdauer L80B10 in h,
- certifications: die Zertifikate und Zeichen, die für diese Ausführung gelten.
Reiche alle Ausführungen zusammen mit submit ein.`,
    prompt: "Im LV der Logistikhalle Werk 2 sind drei Ausführungen der LED-Hallenleuchte Nordlicht HBP Pro ausgeschrieben: HBP-150-840-90-D-S, HBP-200-940-60-V und HBP-100-857-120-N-S. Erfasse ihre technischen Daten aus dem Datenblatt.",
    list: "Listet die Seiten des Datenblatts mit Titel.",
    read: "Liest eine Seite des Datenblatts als Text.",
    search: "Sucht einen Text im Datenblatt (ohne Groß-/Kleinschreibung). Gibt bis zu 10 Treffer mit Seite und Zeile zurück.",
    noPage: "Seite gibt es nicht",
    answer: "Die technischen Daten jeder Ausführung.",
  },
  en: {
    system: `You read technical data from manufacturer data sheets for tender review, using the tools.

For each named version (order code), capture exactly its values, following the data sheet's rules and its latest revision:
- systemPowerW (W), luminousFluxLm (lm), efficacyLmPerW (lm/W), colorTemperatureK (K), criMin (minimum CRI), beamAngleDeg (degrees),
- dimming: none, dali2, or 1-10v,
- diameterMm and heightMm: housing diameter and height without mounting bracket in mm, weightKg (kg),
- ipRating (e.g. IP54), ikRating (e.g. IK06), protectionClass (I, II, or III),
- ambientMinC and ambientMaxC: permitted ambient temperature in °C, lifetimeL80H: lifetime L80B10 in h,
- certifications: the certificates and marks that apply to this version.
Submit all versions together with submit.`,
    prompt: "The BoQ for the Plant 2 logistics hall specifies three versions of the Nordlicht HBP Pro LED high-bay luminaire: HBP-150-840-90-D-S, HBP-200-940-60-V, and HBP-100-857-120-N-S. Capture their technical data from the data sheet.",
    list: "Lists the data sheet's pages with their titles.",
    read: "Reads one page of the data sheet as text.",
    search: "Searches the data sheet for a text, case-insensitive. Returns up to 10 hits with page and line.",
    noPage: "No such page",
    answer: "The technical data of each version.",
  },
};

const NUMBER_FIELDS: Array<[keyof Variant, number]> = [
  ["systemPowerW", 0.5],
  ["luminousFluxLm", 0],
  ["efficacyLmPerW", 1],
  ["colorTemperatureK", 0.5],
  ["criMin", 0.5],
  ["beamAngleDeg", 0.5],
  ["diameterMm", 0.5],
  ["heightMm", 0.5],
  ["weightKg", 0.051],
  ["ambientMinC", 0.5],
  ["ambientMaxC", 0.5],
  ["lifetimeL80H", 0.5],
];

const code = (value: unknown) => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]+/gu, "");
const rating = (value: unknown) => String(value ?? "").toUpperCase().replace(/\s+/gu, "");
const certificate = (value: unknown) => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]+/gu, "");

const datasheet = (lang: Lang): Task<object, Answer> => {
  const copy = COPY[lang];
  const pages = PAGES[lang];
  const tools: Tool<object>[] = [
    {
      name: "list_pages",
      description: copy.list,
      parameters: object({}),
      run: () => ok(pages.map(({ title }, index) => ({ page: index + 1, title }))),
    },
    {
      name: "read_page",
      description: copy.read,
      parameters: object({ page: { type: "integer", minimum: 1, maximum: pages.length } }),
      run: (args) => {
        const page = integerArg(args.page, 0, 0, pages.length + 1);
        const content = pages[page - 1];
        return content ? ok({ page, pages: pages.length, title: content.title, text: content.text }) : refuse(`${copy.noPage}: ${String(args.page)}`);
      },
    },
    {
      name: "search",
      description: copy.search,
      parameters: object({ query: { type: "string" } }),
      run: (args) => {
        const query = String(args.query ?? "").toLowerCase().trim();
        const hits = pages.flatMap(({ text }, index) =>
          text
            .split("\n")
            .filter((line) => query && line.toLowerCase().includes(query))
            .map((line) => ({ page: index + 1, line: line.trim() })),
        );
        return ok({ total: hits.length, hits: hits.slice(0, 10) });
      },
    },
  ];
  const variantSchema = object({
    orderCode: { type: "string" },
    ...Object.fromEntries(NUMBER_FIELDS.map(([field]) => [field, { type: "number" }])),
    dimming: { type: "string", enum: ["none", "dali2", "1-10v"] },
    ipRating: { type: "string" },
    ikRating: { type: "string" },
    protectionClass: { type: "string", enum: ["I", "II", "III"] },
    certifications: { type: "array", items: { type: "string", enum: CERTIFICATIONS } },
  });
  return {
    id: `docs-datasheet-fields-${lang}`,
    track: "docs",
    lang,
    title: "Technical fields from a product data sheet",
    description:
      "Captures 17 technical fields for three order codes of an LED high-bay series from a six-page data sheet read through page and search tools. Traps: order-code decoding, luminous flux from base value × colour, optics, and glass factors with a rounding rule, efficacy from the derived flux, dimensions in cm asked in mm, an option that changes height and IP/IK, weight from base plus option surcharges and an erratum in the revision history, a temperature limit and a lifetime that differ for the 200 W class, a temperature limit for glass with 120° optics, and certifications that depend on the driver. Graded per variant and field with tolerances (flux 0.3 %, efficacy 1 lm/W, weight 0.05 kg, dimensions 0.5 mm) and exact certification sets.",
    system: copy.system,
    prompt: copy.prompt,
    init: () => ({}),
    tools,
    answer: { description: copy.answer, schema: object({ variants: { type: "array", items: variantSchema } }) },
    grade: (answer) => {
      const variants = byKey(answer?.variants, "orderCode", code);
      const checks: Record<string, Check> = {};
      for (const gold of VARIANTS) {
        const actual = variants.get(code(gold.orderCode));
        const name = (field: string) => `${gold.orderCode} ${field}`;
        for (const [field, tolerance] of NUMBER_FIELDS) {
          const value = toNumber(actual?.[field]);
          const expected = gold[field] as number;
          checks[name(field)] = value !== undefined && Math.abs(value - expected) <= (tolerance || expected * 0.003);
        }
        checks[name("dimming")] = String(actual?.dimming ?? "").toLowerCase() === gold.dimming;
        checks[name("ipRating")] = rating(actual?.ipRating) === gold.ipRating;
        checks[name("ikRating")] = rating(actual?.ikRating) === gold.ikRating;
        checks[name("protectionClass")] = rating(actual?.protectionClass) === gold.protectionClass;
        const certifications = Array.isArray(actual?.certifications) ? new Set(actual.certifications.map(certificate)) : new Set<string>();
        checks[name("certifications")] =
          certifications.size === gold.certifications.length && gold.certifications.every((entry) => certifications.has(certificate(entry)));
      }
      const passed = Object.values(checks).filter(Boolean).length;
      return { checks, metrics: { variantsFound: VARIANTS.filter((gold) => variants.has(code(gold.orderCode))).length, fieldAccuracyPct: percent(passed, Object.keys(checks).length) } };
    },
    reference: { variants: VARIANTS },
  };
};

export const datasheetFields = (["de", "en"] as const).map(datasheet);
