/**
 * What every plans task shares: the plan-viewer tools (list, title block, legend, and a zoomable
 * PNG view by drawing zones), the system prompt, and the scores for takeoff quantities and counts.
 */
import { relativeDeviation, toNumber } from "../../src/score";
import type { Lang, Tool } from "../../src/types";
import { MAX_PIXELS, PAPER, renderPng, zoneBox, zoneGrid, type Box } from "./drawing";
import { PROJECT, SHEETS, sheetSvg, type Sheet } from "./sheets";

export type PlanState = { views: number };

const tr = (lang: Lang, de: string, en: string) => (lang === "de" ? de : en);
const refuse = (error: string) => ({ output: { error }, refused: true });

const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });

const find = (lang: Lang, id: unknown) => {
  const sheet = SHEETS.find((candidate) => candidate.id.toLowerCase() === String(id ?? "").trim().toLowerCase());
  return sheet ? { sheet } : { error: tr(lang, `Unbekannter Plan ${String(id)}. Pläne: ${SHEETS.map((s) => s.id).join(", ")}`, `Unknown sheet ${String(id)}. Sheets: ${SHEETS.map((s) => s.id).join(", ")}`) };
};

const scaleText = (lang: Lang, sheet: Sheet) => (sheet.scale ? `1:${sheet.scale}` : tr(lang, "ohne Maßstab", "not to scale"));
const paperText = (sheet: Sheet) => `${sheet.paper} (${PAPER[sheet.paper][0]} × ${PAPER[sheet.paper][1]} mm)`;

/** Renders a box at the requested zoom, lowered so the longer side fits the pixel limit. */
const view = (sheet: Sheet, lang: Lang, box: Box, requested: number | undefined) => {
  const fit = MAX_PIXELS / Math.max(box.w, box.h);
  const zoom = Math.min(requested ?? fit, fit, 10);
  const image = renderPng(sheetSvg(sheet, lang), box, zoom);
  return { zoom: Math.round(zoom * 100) / 100, image, reduced: requested !== undefined && requested > fit + 1e-9 };
};

export const planTools = (lang: Lang): Tool<PlanState>[] => [
  {
    name: "list_sheets",
    description: tr(lang, "Listet die Pläne des Projekts: Plannummer, Inhalt, Fachbereich, Maßstab, Format.", "Lists the project's drawing sheets: sheet number, content, discipline, scale, paper size."),
    parameters: object({}),
    run: () => ({
      output: {
        project: PROJECT[lang],
        sheets: SHEETS.map((sheet) => ({ sheet: sheet.id, title: sheet.title[lang], discipline: sheet.discipline[lang], scale: scaleText(lang, sheet), paper: paperText(sheet) })),
      },
    }),
  },
  {
    name: "get_sheet_info",
    description: tr(
      lang,
      "Liefert den Plankopf eines Plans: Inhalt, Maßstab, Format, Planfelder (Zonenraster) und die allgemeinen Hinweise.",
      "Returns a sheet's title block: content, scale, paper size, drawing zones (grid), and the general notes.",
    ),
    parameters: object({ sheet: { type: "string", description: tr(lang, "Plannummer, z. B. A-101", "Sheet number, e.g. A-101") } }, ["sheet"]),
    run: (args) => {
      const found = find(lang, args.sheet);
      if (!found.sheet) return refuse(found.error);
      const { sheet } = found;
      const grid = zoneGrid(sheet.paper);
      return {
        output: {
          sheet: sheet.id,
          project: PROJECT[lang],
          title: sheet.title[lang],
          discipline: sheet.discipline[lang],
          scale: scaleText(lang, sheet),
          paper: paperText(sheet),
          zones: {
            rows: grid.rows,
            columns: grid.columns,
            usage: tr(lang, "Feld = Zeilenbuchstabe + Spaltenzahl, z. B. C4; Bereich z. B. B2:D5. Die Felder sind am Planrand beschriftet.", "Zone = row letter + column number, e.g. C4; a range e.g. B2:D5. The zones are labelled on the sheet border."),
          },
          notes: sheet.notes.map((note) => note[lang]),
          legend: Boolean(sheet.legend),
        },
      };
    },
  },
  {
    name: "get_legend",
    description: tr(lang, "Liefert die Legende eines Plans: die Einträge als Text und die Legende als Bild.", "Returns a sheet's legend: its entries as text and the legend as an image."),
    parameters: object({ sheet: { type: "string" } }, ["sheet"]),
    run: (args, state) => {
      const found = find(lang, args.sheet);
      if (!found.sheet) return refuse(found.error);
      const { sheet } = found;
      if (!sheet.legend) return refuse(tr(lang, `Plan ${sheet.id} hat keine Legende.`, `Sheet ${sheet.id} has no legend.`));
      state.views++;
      const { image, zoom } = view(sheet, lang, sheet.legend.box, 6);
      return {
        output: {
          sheet: sheet.id,
          entries: sheet.legend.entries.map((entry) => ({ ...(entry.code && /^E\d$/u.test(entry.code) ? { code: entry.code } : {}), name: entry.name[lang] })),
          image: tr(lang, `Legende als PNG, ${image.width}×${image.height} px, zoom ${zoom}`, `Legend as PNG, ${image.width}×${image.height} px, zoom ${zoom}`),
        },
        images: [image.url],
      };
    },
  },
  {
    name: "view",
    description: tr(
      lang,
      `Zeigt einen Plan oder einen Ausschnitt als PNG. region: Planfeld oder Bereich (z. B. "C4" oder "B2:D5"), weglassen für den ganzen Plan. zoom: Pixel je mm Papier (z. B. 2 = Übersicht, 6 = Details); paperMm gibt die Lage des Ausschnitts auf dem Blatt in mm an (links oben = Blattecke); das Bild hat höchstens ${MAX_PIXELS} px Kantenlänge, ein zu großer zoom wird verringert. Kleine Beschriftungen sind erst ab etwa zoom 5 sicher lesbar.`,
      `Shows a sheet or part of it as a PNG. region: a zone or zone range (e.g. "C4" or "B2:D5"); omit for the whole sheet. zoom: pixels per mm of paper (e.g. 2 = overview, 6 = detail); paperMm gives the crop's position on the sheet in mm (top left = sheet corner); the image is at most ${MAX_PIXELS} px on its longer side and a larger zoom is lowered. Small lettering is reliably legible from about zoom 5.`,
    ),
    parameters: object(
      {
        sheet: { type: "string" },
        region: { type: "string", description: tr(lang, "Planfeld oder Bereich, z. B. C4 oder B2:D5", "Zone or range, e.g. C4 or B2:D5") },
        zoom: { type: "number", minimum: 0.5, maximum: 10 },
      },
      ["sheet"],
    ),
    run: (args, state) => {
      const found = find(lang, args.sheet);
      if (!found.sheet) return refuse(found.error);
      const { sheet } = found;
      const region = typeof args.region === "string" && args.region.trim() ? args.region.trim().toUpperCase() : undefined;
      const box = region ? zoneBox(sheet.paper, region) : { x: 0, y: 0, w: PAPER[sheet.paper][0], h: PAPER[sheet.paper][1] };
      if (!box) {
        const grid = zoneGrid(sheet.paper);
        return refuse(tr(lang, `Ungültiger Bereich ${String(args.region)}. Zeilen ${grid.rows}, Spalten ${grid.columns}, z. B. C4 oder B2:D5.`, `Invalid region ${String(args.region)}. Rows ${grid.rows}, columns ${grid.columns}, e.g. C4 or B2:D5.`));
      }
      const requested = toNumber(args.zoom);
      const result = view(sheet, lang, box, requested && requested >= 0.5 ? requested : undefined);
      state.views++;
      return {
        output: {
          sheet: sheet.id,
          region: region ?? tr(lang, "ganzer Plan", "whole sheet"),
          zoom: result.zoom,
          pixels: `${result.image.width}×${result.image.height}`,
          paperMm: { x: Math.round(box.x * 10) / 10, y: Math.round(box.y * 10) / 10, width: Math.round(box.w * 10) / 10, height: Math.round(box.h * 10) / 10 },
          ...(result.reduced
            ? { note: tr(lang, `zoom auf ${result.zoom} verringert (max. ${MAX_PIXELS} px); für mehr Details einen kleineren Bereich wählen.`, `zoom lowered to ${result.zoom} (max ${MAX_PIXELS} px); choose a smaller region for more detail.`) }
            : {}),
        },
        images: [result.image.url],
      };
    },
  },
];

export const system = (lang: Lang) =>
  tr(
    lang,
    `Du bist Kalkulator in einem Fachbetrieb und ermittelst Mengen aus Bauplänen (Mengenermittlung nach Plan).

- Die Pläne erreichst du nur über die Werkzeuge: list_sheets, get_sheet_info (Plankopf und Hinweise), get_legend und view (PNG-Ausschnitt).
- Lies Maße, Höhenkoten, Symbole und Beschriftungen im Plan; beachte die Hinweise und die Legende jedes Plans. Eingetragene Maße gehen vor Abgreifen.
- Zoome für kleine Beschriftungen in Teilbereiche; rufe unabhängige Werkzeuge parallel auf.
- Gib das Ergebnis am Ende mit submit ab.`,
    `You are an estimator at a contractor and take off quantities from construction drawings.

- You reach the drawings only through the tools: list_sheets, get_sheet_info (title block and notes), get_legend, and view (a PNG crop).
- Read dimensions, levels, symbols and labels on the drawings; follow each sheet's notes and legend. Written dimensions take precedence over scaling.
- Zoom into parts of a sheet for small lettering; call independent tools in parallel.
- Submit the result with submit at the end.`,
  );

/** A takeoff quantity: full score within 2 % of the measured value, falling linearly to 0 at 25 %. */
export const takeoffScore = (estimate: unknown, actual: number) => {
  const value = toNumber(estimate);
  if (actual === 0) return value === 0 ? 1 : 0;
  return Math.min(1, Math.max(0, (0.25 - relativeDeviation(value, actual)) / 0.23));
};

/** A count: 1 when exact, losing 1 / max(2, 25 % of the count) per piece missed or extra. */
export const countScore = (estimate: unknown, actual: number) => {
  const value = toNumber(estimate);
  if (value === undefined) return 0;
  return Math.max(0, 1 - Math.abs(value - actual) / Math.max(2, actual * 0.25));
};

export { object };
