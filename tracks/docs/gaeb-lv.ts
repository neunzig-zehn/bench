/**
 * The structure of a GAEB DA XML (X83) bill of quantities, read only through a line-windowed file
 * tool: every title and position with OZ, short text, quantity, unit, and kind. Traps: the OZ is
 * composed from nested RNoPart values across many windows (ids are opaque), remarks look like
 * positions but are none, kinds come from GAEB flags (ALNGroupNo/ALNSerNo, Provis, LumpSumItem)
 * or from the text (Zulage, Mehrpreis), an alternative's base sits in another subtitle or comes
 * after it, repeated descriptions point to another item by opaque id (RefDescr/RefRNo), long
 * texts precede the short text, and a short text is split across spans. Graded per position and
 * field (kind, quantity, unit, short text, base of an alternative), per title label, and on extra
 * positions.
 */
import type { Lang, Task, Tool } from "../../src/types";
import { BOQ_FIELDS, BOQ_SCHEMA, gradeBoq, referenceBoq, type BoqAnswer } from "./boq-positions";
import { GOLD_POSITIONS, GOLD_TITLES, PROJECT, x83 } from "./fixtures/gaeb-lv";
import { integerArg, object, ok, refuse } from "./shared";

const WINDOW = 120;

const COPY = {
  de: {
    system: `Du liest Leistungsverzeichnisse (LV) aus Ausschreibungen mit den Werkzeugen aus. Dateien liest du fensterweise nach Zeilen.

${BOQ_FIELDS.de}
Eine Position mit Wiederholungsbeschreibung hat den Kurztext der Position, auf die sie verweist. Rufe unabhängige Werkzeuge parallel auf und reiche das Ergebnis mit submit ein.`,
    prompt: `Erfasse alle Titel und Positionen des ${PROJECT.de.boq} für das Projekt „${PROJECT.de.name}“ aus der GAEB-Datei in den Projektdateien.`,
    listFiles: "Listet die Projektdateien mit Name, Format, Zeilen und Größe.",
    readFile: `Liest ein Fenster von Zeilen einer Datei, mit Zeilennummern. Höchstens ${WINDOW} Zeilen je Aufruf.`,
    searchFile: "Sucht einen Text (ohne Groß-/Kleinschreibung) in einer Datei. Gibt bis zu 30 Treffer mit Zeilennummer zurück.",
    path: "Dateiname",
    offset: "Erste Zeile, ab 1",
    limit: "Anzahl Zeilen",
    query: "Gesuchter Text",
    answer: "Alle Titel und Positionen des LV.",
    format: "GAEB DA XML 3.3, Datenaustauschphase 83 (Angebotsaufforderung)",
    unknown: "Unbekannte Datei",
  },
  en: {
    system: `You extract bills of quantities (BoQ, German: LV) from tenders using the tools. You read files in windows of lines.

${BOQ_FIELDS.en}
An item with a repeated description has the short text of the item it refers to. Call independent tools in parallel and submit the result with submit.`,
    prompt: `Capture all titles and items of ${PROJECT.en.boq} for the project "${PROJECT.en.name}" from the GAEB file in the project files.`,
    listFiles: "Lists the project files with name, format, lines, and size.",
    readFile: `Reads a window of lines of a file, with line numbers. At most ${WINDOW} lines per call.`,
    searchFile: "Searches a file for a text, case-insensitive. Returns up to 30 hits with line numbers.",
    path: "File name",
    offset: "First line, from 1",
    limit: "Number of lines",
    query: "Text to find",
    answer: "All titles and items of the BoQ.",
    format: "GAEB DA XML 3.3, exchange phase 83 (invitation to tender)",
    unknown: "Unknown file",
  },
} satisfies Record<Lang, Record<string, string>>;

const gaebLv = (lang: Lang): Task<object, BoqAnswer> => {
  const copy = COPY[lang];
  const file = `LV_300_${lang === "de" ? "Rohbau" : "Shell"}.X83`;
  const lines = x83(lang);
  const fileOf = (path: unknown) => (String(path ?? "").trim() === file ? lines : undefined);
  const tools: Tool<object>[] = [
    {
      name: "list_files",
      description: copy.listFiles,
      parameters: object({}),
      run: () => ok([{ path: file, format: copy.format, lines: lines.length, bytes: new TextEncoder().encode(lines.join("\n")).length }]),
    },
    {
      name: "read_file",
      description: copy.readFile,
      parameters: object(
        { path: { type: "string", description: copy.path }, offset: { type: "integer", minimum: 1, description: copy.offset }, limit: { type: "integer", minimum: 1, maximum: WINDOW, description: copy.limit } },
        ["path", "offset"],
      ),
      run: (args) => {
        const content = fileOf(args.path);
        if (!content) return refuse(`${copy.unknown}: ${String(args.path)}`);
        const offset = integerArg(args.offset, 1, 1, content.length);
        const limit = integerArg(args.limit, WINDOW, 1, WINDOW);
        const window = content.slice(offset - 1, offset - 1 + limit);
        return ok({
          path: file,
          totalLines: content.length,
          from: offset,
          to: offset + window.length - 1,
          text: window.map((text, index) => `${String(offset + index).padStart(4)}| ${text}`).join("\n"),
        });
      },
    },
    {
      name: "search_file",
      description: copy.searchFile,
      parameters: object({ path: { type: "string", description: copy.path }, query: { type: "string", description: copy.query } }),
      run: (args) => {
        const content = fileOf(args.path);
        if (!content) return refuse(`${copy.unknown}: ${String(args.path)}`);
        const query = String(args.query ?? "").toLowerCase();
        if (!query) return refuse(copy.query);
        const hits = content.flatMap((text, index) => (text.toLowerCase().includes(query) ? [`${String(index + 1).padStart(4)}| ${text.trim()}`] : []));
        return ok({ total: hits.length, hits: hits.slice(0, 30) });
      },
    },
  ];

  return {
    id: `docs-gaeb-lv-structure-${lang}`,
    track: "docs",
    lang,
    title: "BoQ structure from a GAEB X83 file",
    description:
      "Extracts all 30 titles and 129 positions of a GAEB DA XML (X83) bill of quantities (about 2,900 lines; titles 06–10 from the shared seeded generator, with near-duplicate positions) read through a line-windowed file tool. Traps: OZ composed from nested RNoPart values with opaque ids, remarks that are no positions, kinds from GAEB flags (ALNGroupNo/ALNSerNo, Provis WithTotal/WithoutTotal, LumpSumItem) or from the text (Zulage/Mehrpreis, extra over), an alternative whose base sits in another subtitle or after it, a group with two alternatives, repeated descriptions (RefDescr Rep) whose short text sits in the item their opaque IDRef points to, long text before short text, and a short text split across spans. Graded per position on kind, quantity, unit, short text, and the base of each alternative; per title label (weight 0.5); and on extra positions (weight 3).",
    system: copy.system,
    prompt: copy.prompt,
    init: () => ({}),
    tools,
    answer: { description: copy.answer, schema: BOQ_SCHEMA },
    grade: (answer) => gradeBoq(answer, GOLD_TITLES, GOLD_POSITIONS, lang),
    reference: referenceBoq(GOLD_TITLES, GOLD_POSITIONS, lang),
  };
};

export const gaebLvStructure = (["de", "en"] as const).map(gaebLv);
