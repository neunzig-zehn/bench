/**
 * The structure of a bill of quantities printed to PDF and read back as OCR text, page by page:
 * every title and position with OZ, short text, quantity, unit, and kind. Traps: positions broken
 * across page breaks (the quantity line on the next page, after the repeated header and the
 * carry-over), subtitles and sums that look like positions, kinds stated only in prose with
 * varying wording (Bedarfsposition nur EP, Eventualposition mit Gesamtbetrag, Wahlposition,
 * Grundposition, Zulage), long texts with misleading words ("nach Bedarf", "alternativ"), a letter
 * O for a zero and quantity and unit run together. Graded like the GAEB task: per position on kind,
 * quantity, unit, short text, and the base of each alternative; per title label; on extra positions.
 */
import type { Lang, Task, Tool } from "../../src/types";
import { BOQ_FIELDS, BOQ_SCHEMA, gradeBoq, referenceBoq, type BoqAnswer } from "./boq-positions";
import { GOLD_POSITIONS, GOLD_TITLES, lvPages, PROJECT } from "./fixtures/lv-ocr";
import { integerArg, object, ok, refuse } from "./shared";

const DOCUMENT = "lv-420";

const COPY = {
  de: {
    system: `Du liest Leistungsverzeichnisse (LV) aus Ausschreibungen mit den Werkzeugen aus. Das LV liegt als PDF vor, das du Seite für Seite als OCR-Text liest.

${BOQ_FIELDS.de}
Rufe unabhängige Werkzeuge parallel auf und reiche das Ergebnis mit submit ein.`,
    prompt: `Erfasse alle Titel und Positionen des ${PROJECT.de.boq} für das Projekt „${PROJECT.de.name}“.`,
    list: "Listet die Dokumente des Projekts mit Seitenzahl.",
    read: "Liest eine Seite eines Dokuments als OCR-Text.",
    search: "Sucht einen Text in einem Dokument (ohne Groß-/Kleinschreibung). Gibt bis zu 20 Treffer mit Seite und Zeile zurück.",
    title: `${PROJECT.de.boq} (PDF, OCR)`,
    unknown: "Unbekanntes Dokument",
    noPage: "Seite gibt es nicht",
    answer: "Alle Titel und Positionen des LV.",
  },
  en: {
    system: `You extract bills of quantities (BoQ, German: LV) from tenders using the tools. The BoQ is a PDF that you read page by page as OCR text.

${BOQ_FIELDS.en}
Call independent tools in parallel and submit the result with submit.`,
    prompt: `Capture all titles and items of ${PROJECT.en.boq} for the project "${PROJECT.en.name}".`,
    list: "Lists the project's documents with their page count.",
    read: "Reads one page of a document as OCR text.",
    search: "Searches a document for a text, case-insensitive. Returns up to 20 hits with page and line.",
    title: `${PROJECT.en.boq} (PDF, OCR)`,
    unknown: "Unknown document",
    noPage: "No such page",
    answer: "All titles and items of the BoQ.",
  },
};

const lvOcr = (lang: Lang): Task<object, BoqAnswer> => {
  const copy = COPY[lang];
  const pages = lvPages(lang);
  const tools: Tool<object>[] = [
    {
      name: "list_documents",
      description: copy.list,
      parameters: object({}),
      run: () => ok([{ id: DOCUMENT, title: copy.title, pages: pages.length }]),
    },
    {
      name: "read_page",
      description: copy.read,
      parameters: object({ documentId: { type: "string" }, page: { type: "integer", minimum: 1 } }),
      run: (args) => {
        if (args.documentId !== DOCUMENT) return refuse(`${copy.unknown}: ${String(args.documentId)}`);
        const page = integerArg(args.page, 0, 0, pages.length + 1);
        const text = pages[page - 1];
        return text === undefined ? refuse(`${copy.noPage}: ${String(args.page)}`) : ok({ documentId: DOCUMENT, page, pages: pages.length, text });
      },
    },
    {
      name: "search_document",
      description: copy.search,
      parameters: object({ documentId: { type: "string" }, query: { type: "string" } }),
      run: (args) => {
        if (args.documentId !== DOCUMENT) return refuse(`${copy.unknown}: ${String(args.documentId)}`);
        const query = String(args.query ?? "").toLowerCase().trim();
        const hits = pages.flatMap((text, index) =>
          text
            .split("\n")
            .filter((line) => query && line.toLowerCase().includes(query))
            .map((line) => ({ page: index + 1, line: line.trim() })),
        );
        return ok({ total: hits.length, hits: hits.slice(0, 20) });
      },
    },
  ];
  return {
    id: `docs-lv-ocr-structure-${lang}`,
    track: "docs",
    lang,
    title: "BoQ structure from OCR pages",
    description:
      "Extracts all 26 titles and 124 positions of a 23-page bill of quantities read as OCR text page by page (titles 05–09 from the shared seeded generator, with near-duplicate positions). Traps: positions broken across page breaks (quantity line after the repeated header and carry-over), subtitles and sums that look like positions, kinds stated only in prose with varying wording (provisional with or without total, contingency, option, base, extra over), misleading words in long texts (\"nach Bedarf\", \"alternativ\"), a letter O for a zero, and quantity and unit run together. Graded per position on kind, quantity, unit, short text, and the base of each alternative; per title label (weight 0.5); and on extra positions (weight 3).",
    system: copy.system,
    prompt: copy.prompt,
    init: () => ({}),
    tools,
    answer: { description: copy.answer, schema: BOQ_SCHEMA },
    grade: (answer) => gradeBoq(answer, GOLD_TITLES, GOLD_POSITIONS, lang),
    reference: referenceBoq(GOLD_TITLES, GOLD_POSITIONS, lang),
  };
};

export const lvOcrStructure = (["de", "en"] as const).map(lvOcr);
