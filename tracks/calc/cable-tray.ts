/**
 * Cable tray fill ratio: from a paged cable list, a cable catalog reached by search, a tray catalog,
 * and the planning rules, size the power trays of three routes. Traps: telecom and E30 cables share
 * the routes but not the power tray, cancelled cables, existing cables that remain or are removed,
 * parallel counts, a revision note that changes a cable type, a larger reserve on the main route,
 * inner rather than nominal tray dimensions, permitted side heights, and the tie-break by height.
 * Graded exactly per route: cable count, cross-section sum (whole mm²), tray, fill ratio (0.1 %).
 */
import { LANGS, type Check, type Lang, type Task } from "../../src/types";
import { normalizeText } from "../../src/score";
import { CABLES, CATALOG_LINES, GOLD, ROUTES, RULES, TRAYS } from "./fixtures/cable-tray";
import { byKey, calculateTool, localize, matches, object, ok, page, pageParameters } from "./shared";

type Answer = { routes: Array<{ route: string; cableCount: number; crossSectionSumMm2: number; tray: string; fillRatioPercent: number }> };

const NAMES_DE = {
  id: "id",
  type: "typ",
  to: "ziel",
  routes: "trassen",
  count: "anzahl",
  status: "status",
  note: "vermerk",
  articleNo: "artikelnummer",
  outerDiameterMm: "aussendurchmesserMm",
  weightKgPerKm: "gewichtKgProKm",
  designation: "bezeichnung",
  nominalWidthMm: "nennbreiteMm",
  sideHeightMm: "seitenhoeheMm",
  innerWidthMm: "lichteInnenbreiteMm",
  usableFillHeightMm: "nutzbareFuellhoeheMm",
  lines: "zeilen",
  document: "dokument",
};

const compact = (text: unknown) => normalizeText(text).replaceAll(" ", "");

const normalizeType = (text: string) => text.toLowerCase().replaceAll(",", ".").replaceAll("×", "x").replace(/\s+/gu, " ").trim();

const searchCatalog = (query: string) => {
  const wanted = normalizeType(query).split(" ").filter(Boolean);
  return CATALOG_LINES.map((line) => {
    const type = normalizeType(line.type);
    const score = (type === normalizeType(query) ? 100 : 0) + wanted.filter((token) => type.split(" ").includes(token)).length;
    return { line, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ line }) => line);
};

const TEXT = {
  de: {
    status: { new: "neu", cancelled: "entfällt", existing: "Bestand, verbleibt", removed: "Bestand, Rückbau" },
    system: `Du bist Elektroplaner und bemisst Kabeltragsysteme mit den Werkzeugen. Die Daten erreichst du nur über die Werkzeuge; rechne mit calculate. Lies die Planungsgrundsätze vollständig, bevor du rechnest. Rufe unabhängige Werkzeuge parallel auf. Wenn du fertig bist, rufe submit mit deinem Ergebnis auf.`,
    prompt: "Bemiss die Starkstromrinnen der Trassen KR-1, KR-2 und KR-3 im 2. OG des Bürogebäudes Lindenallee 4 nach den Planungsgrundsätzen: welche Rinne, mit welchem Füllgrad?",
    tools: {
      list_cables: "Listet die Kabelliste des 2. OG seitenweise: ID, Typ, Ziel, durchlaufene Trassen, Anzahl, Status, Vermerk. Höchstens 8 Zeilen je Aufruf.",
      search_cable_catalog: "Sucht im Kabelkatalog nach Kabeltyp, z. B. „NYM-J 5x2.5“. Gibt bis zu 5 Katalogzeilen zurück: Artikelnummer, Typ, Außendurchmesser in mm, Gewicht.",
      list_trays: "Gibt den Rinnenkatalog zurück: Bezeichnung, Nennbreite, Seitenhöhe, lichte Innenbreite und nutzbare Füllhöhe in mm.",
      get_rules: "Gibt die Planungsgrundsätze für Kabeltragsysteme zurück.",
    },
    answer: "Die Bemessung der Starkstromrinne je Trasse.",
    fields: {
      routes: "Eine Bemessung je Trasse",
      route: "Trasse, z. B. KR-1",
      cableCount: "Anzahl der Kabel in der Starkstromrinne der Trasse, parallel verlegte Kabel einzeln gezählt",
      crossSectionSumMm2: "Summe der Kabelquerschnitte ohne Reserve in mm², auf ganze mm² gerundet",
      tray: "Bezeichnung der gewählten Rinne laut Rinnenkatalog, z. B. KR 60.100",
      fillRatioPercent: "Füllgrad der gewählten Rinne einschließlich Reserve in Prozent, eine Nachkommastelle",
    },
  },
  en: {
    status: { new: "new", cancelled: "cancelled", existing: "existing, remains", removed: "existing, removed" },
    system: `You are an electrical designer sizing cable support systems with the tools. You reach the data only through the tools; calculate with calculate. Read the design rules completely before you calculate. Call independent tools in parallel. When you are done, call submit with your result.`,
    prompt: "Size the power trays of routes KR-1, KR-2 and KR-3 on the 2nd floor of the office building Lindenallee 4 according to the design rules: which tray, at what fill ratio?",
    tools: {
      list_cables: "Lists the cable list of the 2nd floor page by page: id, type, destination, routes passed, count, status, note. At most 8 rows per call.",
      search_cable_catalog: "Searches the cable catalog by cable type, e.g. \"NYM-J 5x2.5\". Returns up to 5 catalog lines: article number, type, outer diameter in mm, weight.",
      list_trays: "Returns the tray catalog: designation, nominal width, side height, inner width and usable fill height in mm.",
      get_rules: "Returns the design rules for cable support systems.",
    },
    answer: "The sizing of the power tray per route.",
    fields: {
      routes: "One sizing per route",
      route: "Route, e.g. KR-1",
      cableCount: "Number of cables in the route's power tray, cables laid in parallel counted individually",
      crossSectionSumMm2: "Sum of cable cross-sections without reserve in mm², rounded to whole mm²",
      tray: "Designation of the chosen tray from the tray catalog, e.g. KR 60.100",
      fillRatioPercent: "Fill ratio of the chosen tray including the reserve in percent, one decimal",
    },
  },
};

const make = (lang: Lang): Task<Record<string, never>, Answer> => {
  const text = TEXT[lang];
  const out = (value: unknown) => ok(localize(lang, value, NAMES_DE));
  return {
    id: `calc-cable-tray-${lang}`,
    track: "calc",
    lang,
    title: "Cable tray fill ratio",
    description:
      "Sizes the power trays of three routes from a paged cable list, a searchable cable catalog, a tray catalog and the design rules. Traps: telecom and E30 cables on the same routes, cancelled cables, existing cables that remain or are removed, parallel counts, a revision note changing a type, a larger reserve on the main route, inner tray dimensions, permitted side heights and the tie-break by height.",
    system: text.system,
    prompt: text.prompt,
    init: () => ({}),
    tools: [
      {
        name: "list_cables",
        description: text.tools.list_cables,
        parameters: pageParameters(8),
        run: (args) => {
          const { rows, ...rest } = page(CABLES, args, 8);
          return out({
            ...rest,
            rows: rows.map((cable) => ({
              id: cable.id,
              type: cable.type,
              to: cable.to[lang],
              routes: cable.route.join(", "),
              count: cable.count,
              status: text.status[cable.status ?? "new"],
              ...(cable.note ? { note: cable.note[lang] } : {}),
            })),
          });
        },
      },
      {
        name: "search_cable_catalog",
        description: text.tools.search_cable_catalog,
        parameters: object({ query: { type: "string" } }),
        run: (args) => out({ lines: searchCatalog(String(args.query ?? "")) }),
      },
      {
        name: "list_trays",
        description: text.tools.list_trays,
        parameters: object({}),
        run: () =>
          out({
            rows: TRAYS.map((tray) => ({
              designation: tray.designation,
              nominalWidthMm: tray.nominalWidth,
              sideHeightMm: tray.sideHeight,
              innerWidthMm: tray.innerWidth,
              usableFillHeightMm: tray.usableHeight,
            })),
          }),
      },
      { name: "get_rules", description: text.tools.get_rules, parameters: object({}), run: () => out({ document: RULES[lang] }) },
      calculateTool(lang),
    ],
    answer: {
      description: text.answer,
      schema: object({
        routes: {
          type: "array",
          description: text.fields.routes,
          items: object({
            route: { type: "string", description: text.fields.route },
            cableCount: { type: "integer", description: text.fields.cableCount },
            crossSectionSumMm2: { type: "number", description: text.fields.crossSectionSumMm2 },
            tray: { type: "string", description: text.fields.tray },
            fillRatioPercent: { type: "number", description: text.fields.fillRatioPercent },
          }),
        },
      }),
    },
    grade: (answer) => {
      const routes = byKey(answer?.routes, "route");
      const checks: Record<string, Check> = {};
      for (const { id } of ROUTES) {
        const given = routes.get(id);
        const gold = GOLD[id]!;
        checks[`${id} cable count`] = matches(given?.cableCount, gold.count, 0);
        checks[`${id} cross-section sum`] = { score: matches(given?.crossSectionSumMm2, gold.crossSection, 0) ? 1 : 0, weight: 2 };
        checks[`${id} tray`] = { score: compact(given?.tray) === compact(gold.tray) ? 1 : 0, weight: 3 };
        checks[`${id} fill ratio`] = { score: matches(given?.fillRatioPercent, gold.fillPercent, 1) ? 1 : 0, weight: 2 };
      }
      return { checks, metrics: { traysRight: ROUTES.filter(({ id }) => compact(routes.get(id)?.tray) === compact(GOLD[id]!.tray)).length } };
    },
    reference: {
      routes: ROUTES.map(({ id }) => ({ route: id, cableCount: GOLD[id]!.count, crossSectionSumMm2: GOLD[id]!.crossSection, tray: GOLD[id]!.tray, fillRatioPercent: GOLD[id]!.fillPercent })),
    },
  };
};

export const cableTray = LANGS.map(make);
