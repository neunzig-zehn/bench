/**
 * Supplier offer lines from three scanned page images, viewed page by page. Traps: price units in a
 * PE column (per 100 m), line discounts, a metal surcharge per metre from a printed copper formula,
 * a received stamp over a printed total (derivable from quantity and price), a handwritten price
 * correction, a handwritten discount correction, a line struck out by hand, a handwritten note
 * that extends a discount to another line, alternative and provisional markers, a last page
 * scanned upside down (the viewer can turn it), small print that needs the viewer's zoom, and a
 * slight tilt and blur. Graded per line on article, quantity, unit, unit price, printed total
 * (not where handwriting changes the line), and flags, plus no extra lines and the corrected net
 * total, which differs from the printed one.
 */
import type { Lang, Task, Tool } from "../../src/types";
import { GOLD_LINES, PAGES, SECTIONS } from "./fixtures/offer-scan";
import { gradeOfferLines, OFFER_LINES_RULES, OFFER_LINES_SCHEMA, referenceLines } from "./offer-lines";
import { integerArg, object, ok, refuse } from "./shared";

const DOCUMENT = "angebot-e-2026-0447";

const COPY = {
  de: {
    system: `Du erfasst Lieferantenangebote für die Kalkulation mit den Werkzeugen. Das Angebot liegt als Scan vor; du siehst jede Seite als Bild. Handschriftliche Änderungen auf dem Scan gelten.

${OFFER_LINES_RULES.de}`,
    prompt: "Erfasse alle Positionen aus dem gescannten Angebot E-2026-0447 der Elektro Kaiser GmbH für die Grundschule Am Mühlbach.",
    list: "Listet die Dokumente des Projekts mit Seitenzahl.",
    view: "Zeigt eine Seite eines gescannten Dokuments als Übersichtsbild in geringer Auflösung. zoom = top oder bottom zeigt die obere oder untere Hälfte in voller Auflösung; rotate = 180 dreht die Seite um 180°.",
    title: "Angebot E-2026-0447, Elektro Kaiser GmbH (Scan)",
    shown: "Das Bild der Seite folgt.",
    unknown: "Unbekanntes Dokument",
    noPage: "Seite gibt es nicht",
    answer: "Alle Positionen des Angebots.",
  },
  en: {
    system: `You capture supplier offers for estimating using the tools. The offer is a scan; you see each page as an image. Handwritten changes on the scan apply.

${OFFER_LINES_RULES.en}`,
    prompt: "Capture all line items of the scanned offer E-2026-0447 from Elektro Kaiser GmbH for Am Mühlbach primary school.",
    list: "Lists the project's documents with their page count.",
    view: "Shows one page of a scanned document as a low-resolution overview image. zoom = top or bottom shows the upper or lower half at full resolution; rotate = 180 turns the page by 180°.",
    title: "Offer E-2026-0447, Elektro Kaiser GmbH (scan)",
    shown: "The page image follows.",
    unknown: "Unknown document",
    noPage: "No such page",
    answer: "All line items of the offer.",
  },
};

const image = async (lang: Lang, page: number, turned: boolean, zoom: string) =>
  `data:image/jpeg;base64,${Buffer.from(await Bun.file(new URL(`fixtures/offer-scan-${lang}-${page}${turned ? "-r180" : ""}${zoom ? `-${zoom}` : ""}.jpg`, import.meta.url)).arrayBuffer()).toString("base64")}`;

const offerScan = (lang: Lang): Task<object, { lines: unknown[]; netTotal: number }> => {
  const copy = COPY[lang];
  const tools: Tool<object>[] = [
    {
      name: "list_documents",
      description: copy.list,
      parameters: object({}),
      run: () => ok([{ id: DOCUMENT, title: copy.title, pages: PAGES }]),
    },
    {
      name: "view_page",
      description: copy.view,
      parameters: object(
        { documentId: { type: "string" }, page: { type: "integer", minimum: 1 }, rotate: { type: "integer", enum: [0, 180] }, zoom: { type: "string", enum: ["top", "bottom"] } },
        ["documentId", "page"],
      ),
      run: async (args) => {
        if (args.documentId !== DOCUMENT) return refuse(`${copy.unknown}: ${String(args.documentId)}`);
        const page = integerArg(args.page, 0, 0, PAGES + 1);
        if (page < 1 || page > PAGES) return refuse(`${copy.noPage}: ${String(args.page)}`);
        const turned = Number(args.rotate ?? 0) === 180;
        const zoom = args.zoom === "top" || args.zoom === "bottom" ? args.zoom : "";
        return { output: { documentId: DOCUMENT, page, pages: PAGES, rotate: turned ? 180 : 0, zoom: zoom || null, note: copy.shown }, images: [await image(lang, page, turned, zoom)] };
      },
    },
  ];
  const lines = SECTIONS.flatMap((section) => section.lines);
  return {
    id: `docs-offer-scan-lines-${lang}`,
    track: "docs",
    lang,
    title: "Supplier offer lines from scanned pages",
    description:
      "Extracts 24 lines of a three-page scanned electrical offer viewed as images. Traps: price units in a PE column (per 100 m), line discounts, a metal surcharge per metre computed from a printed copper formula, a received stamp over a printed total, handwritten price and discount corrections, a line struck out by hand, a handwritten note that extends a discount to another line, alternative and provisional markers, a last page scanned upside down (the viewer can turn it by 180°), a low-resolution overview whose small print (copper formula, handwriting) needs the viewer's zoom, tilt and blur. Graded per line on article, quantity, unit, unit price, printed total (not where handwriting changes the line), and flags; no extra lines (weight 2); and the net total after all corrections and surcharges (weight 5, within 15 cents), which differs from the printed total.",
    system: copy.system,
    prompt: copy.prompt,
    init: () => ({}),
    tools,
    answer: { description: copy.answer, schema: OFFER_LINES_SCHEMA },
    grade: (answer) => gradeOfferLines(answer, GOLD_LINES, lang),
    reference: referenceLines(GOLD_LINES, lang, ({ pos }) => lines.find((line) => line.pos === pos)!.text[lang]),
  };
};

export const offerScanLines = (["de", "en"] as const).map(offerScan);
