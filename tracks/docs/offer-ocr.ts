/**
 * Supplier offer lines from four OCR text pages, read page by page. Traps: German or English
 * number formats, price units from the section header (per 100), an inline note (price/12), and a
 * page footnote (per 10 m); line, section, quantity-threshold, and special discounts; a metal
 * surcharge from a second footnote; prices misread by OCR (l for 1, O for 0, B for 8) that the
 * printed totals resolve; a correction at the end of the document; a discontinued line and its replacement; alternative and provisional markers; a
 * merged quantity and unit; figures on the row below; a description continued on the next page.
 * Graded per line on article, quantity, unit, unit price, printed total, and flags, plus the
 * joined description of item 10, no extra lines, and the corrected net total, which differs from
 * the printed one.
 */
import type { Lang, Task, Tool } from "../../src/types";
import { GOLD_LINES, offerPages, PAGES, SECTIONS } from "./fixtures/offer-ocr";
import { gradeOfferLines, OFFER_LINES_RULES, OFFER_LINES_SCHEMA, referenceLines } from "./offer-lines";
import { integerArg, object, ok, refuse } from "./shared";

const DOCUMENT = "angebot-2026-131";

const COPY = {
  de: {
    system: `Du erfasst Lieferantenangebote für die Kalkulation mit den Werkzeugen. Die Dokumente liegen als OCR-Text vor, Seite für Seite.

${OFFER_LINES_RULES.de}`,
    prompt: "Erfasse alle Positionen aus dem Angebot 2026-131 der Haustechnik Müller GmbH für die Kita Sonnenweg.",
    list: "Listet die Dokumente des Projekts mit Seitenzahl.",
    read: "Liest eine Seite eines Dokuments als OCR-Text.",
    title: "Angebot 2026-131, Haustechnik Müller GmbH (Scan, OCR)",
    unknown: "Unbekanntes Dokument",
    noPage: "Seite gibt es nicht",
    answer: "Alle Positionen des Angebots.",
    joined: /4471\)?,?\s*verchromt/iu,
  },
  en: {
    system: `You capture supplier offers for estimating using the tools. The documents are OCR text, page by page.

${OFFER_LINES_RULES.en}`,
    prompt: "Capture all line items of offer 2026-131 from Haustechnik Müller GmbH for the Sonnenweg day-care centre.",
    list: "Lists the project's documents with their page count.",
    read: "Reads one page of a document as OCR text.",
    title: "Offer 2026-131, Haustechnik Müller GmbH (scan, OCR)",
    unknown: "Unknown document",
    noPage: "No such page",
    answer: "All line items of the offer.",
    joined: /4471\)?,?\s*chrome/iu,
  },
};

const offerOcr = (lang: Lang): Task<object, { lines: unknown[]; netTotal: number }> => {
  const copy = COPY[lang];
  const pages = offerPages(lang);
  const tools: Tool<object>[] = [
    {
      name: "list_documents",
      description: copy.list,
      parameters: object({}),
      run: () => ok([{ id: DOCUMENT, title: copy.title, pages: PAGES }]),
    },
    {
      name: "read_page",
      description: copy.read,
      parameters: object({ documentId: { type: "string" }, page: { type: "integer", minimum: 1 } }),
      run: (args) => {
        if (args.documentId !== DOCUMENT) return refuse(`${copy.unknown}: ${String(args.documentId)}`);
        const page = integerArg(args.page, 0, 0, PAGES + 1);
        const text = pages[page - 1];
        return text === undefined ? refuse(`${copy.noPage}: ${String(args.page)}`) : ok({ documentId: DOCUMENT, page, pages: PAGES, text });
      },
    },
  ];
  const lineOf = (pos: string) => SECTIONS.flatMap((section) => section.lines).find((line) => line.pos === pos)!;
  return {
    id: `docs-offer-ocr-lines-${lang}`,
    track: "docs",
    lang,
    title: "Supplier offer lines from OCR pages",
    description:
      "Extracts 31 lines of a four-page supplier offer read as OCR text page by page (ported from 90/10's bench/extract). Traps: price units from section header, inline note, and page footnote; line, section, quantity-threshold, and special discounts; a metal surcharge from a second footnote; two prices misread by OCR that the printed totals resolve; a correction note at the end; a discontinued line and its replacement; alternative and provisional markers; a merged quantity and unit; figures on the next row; a description continued on the next page. Graded per line on article, quantity, unit, unit price, printed total (not for the corrected line), and flags; the joined description of item 10; no extra lines (weight 2); and the net total after all corrections (weight 5, within 15 cents), which differs from the printed net total.",
    system: copy.system,
    prompt: copy.prompt,
    init: () => ({}),
    tools,
    answer: { description: copy.answer, schema: OFFER_LINES_SCHEMA },
    grade: (answer) =>
      gradeOfferLines(answer, GOLD_LINES, lang, (line, actual): Record<string, boolean> =>
        line.pos === "10" ? { "pos 10 description across page break": copy.joined.test(String(actual?.description ?? "")) } : {},
      ),
    reference: referenceLines(GOLD_LINES, lang, ({ pos }) => {
      const line = lineOf(pos);
      return line.continuation ? `${line.text[lang]} ${line.continuation[lang]}` : line.text[lang];
    }),
  };
};

export const offerOcrLines = (["de", "en"] as const).map(offerOcr);
