/**
 * Feeder sizing for a kitchen sub-distribution: demand with group simultaneity factors, the design
 * current, the fuse, and the smallest cable cross-section that carries the fuse current in every
 * route section after temperature and grouping factors and keeps the voltage drop within the limit.
 * Traps: loads in W and kVA, a cooking factor by appliance count (quantities, not rows, and not the
 * spare circuits), a cancelled consumer and spare circuits, grouping counts given
 * without the feeder itself and missing from the table, the hotter section governing, and the
 * voltage drop forcing a larger section than ampacity alone. Graded exactly at the stated precision.
 */
import { LANGS, type Lang, type Task } from "../../src/types";
import { AMPACITY, basis, CONSUMERS, GOLD, GROUP_NAMES, GROUPING_FACTORS, ROUTE_SECTIONS, SECTIONS, TEMPERATURE_FACTORS } from "./fixtures/feeder";
import { calculateTool, localize, matches, object, ok, page, pageParameters, refuse } from "./shared";

type Answer = { demandKw: number; designCurrentA: number; fuseRatingA: number; crossSectionMm2: number; voltageDropPercent: number };

const NAMES_DE = {
  id: "id",
  name: "bezeichnung",
  group: "gruppe",
  quantity: "anzahl",
  powerPerUnit: "leistungJeStueck",
  unit: "einheit",
  cosPhi: "cosPhi",
  status: "status",
  note: "vermerk",
  document: "dokument",
  sections: "abschnitte",
  section: "abschnitt",
  lengthM: "laengeM",
  laying: "verlegung",
  layingMethod: "verlegeart",
  ambientTemperatureC: "umgebungstemperaturC",
  otherMultiCoreCables: "weitereMehradrigeKabel",
  method: "verlegeart",
  conditions: "bedingungen",
  crossSectionMm2: "querschnittMm2",
  ampacityA: "belastbarkeitA",
  temperature: "temperatur",
  grouping: "haeufung",
  ambientC: "umgebungC",
  factor: "faktor",
  cables: "kabel",
};

const TEXT = {
  de: {
    status: { active: "aktiv", cancelled: "entfällt", spare: "Reserve" },
    system: "Du bist Elektroplaner und bemisst Zuleitungen mit den Werkzeugen. Die Daten erreichst du nur über die Werkzeuge; rechne mit calculate. Lies die Bemessungsgrundlagen vollständig, bevor du rechnest. Rufe unabhängige Werkzeuge parallel auf. Wenn du fertig bist, rufe submit mit deinem Ergebnis auf.",
    prompt: "Bemiss die Zuleitung von der NSHV zur Unterverteilung UV-K der Mensaküche nach den Bemessungsgrundlagen.",
    conditions: "Drei belastete Kupferleiter, PVC-Isolierung, Umgebungstemperatur 30 °C. C: auf einer Wand; E: frei in Luft auf gelochter Kabelrinne.",
    groupingConditions: "Mehradrige Kabel einlagig, sich berührend, auf gelochter Kabelrinne; Anzahl = alle Kabel im Abschnitt.",
    unknownMethod: "Unbekannte Verlegeart. Verfügbar: C, E.",
    tools: {
      list_consumers: "Listet die Verbraucherliste der UV-K seitenweise: ID, Bezeichnung, Gruppe, Anzahl, Leistung je Stück mit Einheit (und cos φ bei kVA), Status, Vermerk. Höchstens 6 Zeilen je Aufruf.",
      get_design_basis: "Gibt die Bemessungsgrundlagen der Zuleitung zurück.",
      get_route: "Gibt die Trasse der Zuleitung NSHV → UV-K abschnittsweise zurück: Länge, Verlegung, Verlegeart, Umgebungstemperatur, weitere Kabel im Abschnitt.",
      get_ampacity_table: "Gibt die Belastbarkeitstabelle I_r für eine Verlegeart (C oder E) zurück.",
      get_correction_factors: "Gibt die Umrechnungsfaktoren für Umgebungstemperatur und Häufung zurück.",
    },
    answer: "Die Bemessung der Zuleitung.",
    fields: {
      demandKw: "Leistungsbedarf in kW, zwei Nachkommastellen",
      designCurrentA: "Betriebsstrom I_B in A, eine Nachkommastelle",
      fuseRatingA: "Bemessungsstrom der Sicherung I_n in A",
      crossSectionMm2: "Gewählter Querschnitt in mm²",
      voltageDropPercent: "Spannungsfall des gewählten Querschnitts in %, zwei Nachkommastellen",
    },
  },
  en: {
    status: { active: "active", cancelled: "cancelled", spare: "spare" },
    system: "You are an electrical designer sizing feeders with the tools. You reach the data only through the tools; calculate with calculate. Read the design basis completely before you calculate. Call independent tools in parallel. When you are done, call submit with your result.",
    prompt: "Size the feeder from the main LV switchboard to the canteen kitchen sub-distribution UV-K according to the design basis.",
    conditions: "Three loaded copper conductors, PVC insulation, ambient temperature 30 °C. C: on a wall; E: in free air on a perforated tray.",
    groupingConditions: "Multi-core cables in a single layer, touching, on a perforated tray; number = all cables in the section.",
    unknownMethod: "Unknown laying method. Available: C, E.",
    tools: {
      list_consumers: "Lists the consumer list of UV-K page by page: id, name, group, quantity, power per unit with its unit (and cos φ for kVA), status, note. At most 6 rows per call.",
      get_design_basis: "Returns the design basis for the feeder.",
      get_route: "Returns the route of the feeder main LV switchboard → UV-K section by section: length, laying, laying method, ambient temperature, other cables in the section.",
      get_ampacity_table: "Returns the ampacity table I_r for one laying method (C or E).",
      get_correction_factors: "Returns the correction factors for ambient temperature and grouping.",
    },
    answer: "The sizing of the feeder.",
    fields: {
      demandKw: "Power demand in kW, two decimals",
      designCurrentA: "Design current I_B in A, one decimal",
      fuseRatingA: "Rated current of the fuse I_n in A",
      crossSectionMm2: "Chosen cross-section in mm²",
      voltageDropPercent: "Voltage drop of the chosen cross-section in %, two decimals",
    },
  },
};

const make = (lang: Lang): Task<Record<string, never>, Answer> => {
  const text = TEXT[lang];
  const out = (value: unknown) => ok(localize(lang, value, NAMES_DE));
  return {
    id: `calc-feeder-sizing-${lang}`,
    track: "calc",
    lang,
    title: "Feeder sizing: demand, current, fuse, cross-section",
    description:
      "Sizes a sub-distribution feeder: group simultaneity factors, I = P/(√3·U·cosφ), the fuse, derated ampacity in every route section, and the voltage-drop limit. Traps: loads in W and kVA, a cooking factor by appliance count, cancelled and spare circuits, grouping counts excluding the feeder and missing from the table, the governing hot section, and the voltage drop forcing a larger section.",
    system: text.system,
    prompt: text.prompt,
    init: () => ({}),
    tools: [
      {
        name: "list_consumers",
        description: text.tools.list_consumers,
        parameters: pageParameters(6),
        run: (args) => {
          const { rows, ...rest } = page(CONSUMERS, args, 6);
          return out({
            ...rest,
            rows: rows.map((consumer) => ({
              id: consumer.id,
              name: consumer.name[lang],
              group: GROUP_NAMES[consumer.group][lang],
              quantity: consumer.quantity,
              powerPerUnit: consumer.power,
              unit: consumer.unit,
              ...(consumer.cosPhi ? { cosPhi: consumer.cosPhi } : {}),
              status: text.status[consumer.status ?? "active"],
              ...(consumer.note ? { note: consumer.note[lang] } : {}),
            })),
          });
        },
      },
      { name: "get_design_basis", description: text.tools.get_design_basis, parameters: object({}), run: () => out({ document: basis(lang) }) },
      {
        name: "get_route",
        description: text.tools.get_route,
        parameters: object({}),
        run: () =>
          out({
            sections: ROUTE_SECTIONS.map((section) => ({
              section: section.id,
              lengthM: section.length,
              laying: section.place[lang],
              layingMethod: section.method,
              ambientTemperatureC: section.temperature,
              otherMultiCoreCables: section.cables - 1,
            })),
          }),
      },
      {
        name: "get_ampacity_table",
        description: text.tools.get_ampacity_table,
        parameters: object({ method: { type: "string", enum: ["C", "E"] } }),
        run: (args) => {
          const method = String(args.method ?? "").toUpperCase();
          if (method !== "C" && method !== "E") return refuse(lang, text.unknownMethod);
          return out({ method, conditions: text.conditions, rows: SECTIONS.map((section, index) => ({ crossSectionMm2: section, ampacityA: AMPACITY[method][index] })) });
        },
      },
      {
        name: "get_correction_factors",
        description: text.tools.get_correction_factors,
        parameters: object({}),
        run: () =>
          out({
            temperature: Object.entries(TEMPERATURE_FACTORS).map(([ambient, factor]) => ({ ambientC: Number(ambient), factor })),
            grouping: { conditions: text.groupingConditions, rows: Object.entries(GROUPING_FACTORS).map(([cables, factor]) => ({ cables: Number(cables), factor })) },
          }),
      },
      calculateTool(lang),
    ],
    answer: {
      description: text.answer,
      schema: object({
        demandKw: { type: "number", description: text.fields.demandKw },
        designCurrentA: { type: "number", description: text.fields.designCurrentA },
        fuseRatingA: { type: "number", description: text.fields.fuseRatingA },
        crossSectionMm2: { type: "number", description: text.fields.crossSectionMm2 },
        voltageDropPercent: { type: "number", description: text.fields.voltageDropPercent },
      }),
    },
    grade: (answer) => ({
      checks: {
        "power demand": { score: matches(answer?.demandKw, GOLD.demandKw, 2) ? 1 : 0, weight: 2 },
        "design current": { score: matches(answer?.designCurrentA, GOLD.current, 1) ? 1 : 0, weight: 2 },
        fuse: { score: matches(answer?.fuseRatingA, GOLD.fuse, 0) ? 1 : 0, weight: 2 },
        "cross-section": { score: matches(answer?.crossSectionMm2, GOLD.section, 1) ? 1 : 0, weight: 3 },
        "voltage drop": { score: matches(answer?.voltageDropPercent, GOLD.drop, 2) ? 1 : 0, weight: 2 },
      },
    }),
    reference: { demandKw: GOLD.demandKw, designCurrentA: GOLD.current, fuseRatingA: GOLD.fuse, crossSectionMm2: GOLD.section, voltageDropPercent: GOLD.drop },
  };
};

export const feederSizing = LANGS.map(make);
