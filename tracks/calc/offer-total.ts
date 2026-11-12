/**
 * Offer total of a 123-item sanitary tender, ported from the 90/10 totals eval and made multi-step:
 * the LV comes page by page, the preliminary notes, answers to bidder questions and the cover letter
 * through a document tool. Traps: contingency, alternative and "without total" items, also under
 * their synonyms, a whole title of contingency items with one item reinstated, three amendments in
 * reverse order (one replaces an item, one changes a quantity twice), answers that reinstate an item
 * and change a quantity, daywork that stays in the total, a discount threshold just below the true net
 * total and applying to two titles only, a lump-sum discount, and distractors (site utilities,
 * cash discount). Graded on each decided item, the amended quantity, and every total to the cent.
 */
import { LANGS, type Check, type Lang, type Task } from "../../src/types";
import { relativeDeviation } from "../../src/score";
import { AMENDED_QUANTITIES, ANSWERS, COVER_LETTER, DECISIONS, EXCLUDED, GOLD, NOTES, POSITIONS, TITLES, UNITS } from "./fixtures/offer-total";
import { byKey, calculateTool, localize, matches, object, ok, page, pageParameters, refuse } from "./shared";

type Answer = {
  excludedPositions: string[];
  changedQuantities: Array<{ ordinal: string; quantity: number }>;
  netBeforeDiscount: number;
  percentDiscount: number;
  lumpDiscount: number;
  netAfterDiscount: number;
  vat: number;
  gross: number;
};

const NAMES_DE = {
  ordinal: "oz",
  title: "titel",
  text: "kurztext",
  quantity: "menge",
  unit: "einheit",
  unitPrice: "einheitspreis",
  marking: "vermerk",
  documents: "dokumente",
  id: "id",
  pages: "seiten",
  page: "seite",
};

const DOCUMENTS = {
  notes: NOTES,
  "bidder-questions": { de: [ANSWERS.de], en: [ANSWERS.en] },
  "cover-letter": { de: [COVER_LETTER.de], en: [COVER_LETTER.en] },
};
type DocumentId = keyof typeof DOCUMENTS;

const TEXT = {
  de: {
    system: "Du bist Kalkulator bei einem Sanitärbetrieb und ermittelst Angebotssummen mit den Werkzeugen. Die Daten erreichst du nur über die Werkzeuge; rechne mit calculate. Lies alle Dokumente vollständig, bevor du rechnest. Rufe unabhängige Werkzeuge parallel auf. Wenn du fertig bist, rufe submit mit deinem Ergebnis auf.",
    prompt: "Ermittle die Angebotssumme der Haustechnik Müller GmbH für das LV „Neubau Kita Sonnenweg 12, Sanitärinstallation“, wie der Bieter sie abgeben würde.",
    titles: { notes: "Vorbemerkungen zum Leistungsverzeichnis", "bidder-questions": "Antworten auf Bieterfragen", "cover-letter": "Angebotsschreiben des Bieters" },
    unknown: (id: string) => `Unbekanntes Dokument ${id}. Dokumente: ${Object.keys(DOCUMENTS).join(", ")}.`,
    noPage: (pages: number) => `Diese Seite gibt es nicht. Das Dokument hat ${pages} Seiten.`,
    tools: {
      list_positions: "Listet das Leistungsverzeichnis mit den Einheitspreisen des Bieters seitenweise: OZ, Titel, Kurztext, Menge, Einheit, Einheitspreis in EUR, Vermerk. Höchstens 15 Positionen je Aufruf.",
      list_documents: "Listet die Dokumente zum Angebot mit ihrer Seitenzahl.",
      read_document: "Gibt eine Seite eines Dokuments zurück.",
    },
    answer: "Die Angebotssumme mit ihren Bestandteilen.",
    fields: {
      excludedPositions: "OZ aller Positionen, die nicht in die Angebotssumme eingerechnet werden",
      changedQuantities: "Positionen, deren maßgebende Menge von der Menge im LV abweicht, mit der maßgebenden Menge",
      ordinal: "OZ, z. B. 01.01",
      quantity: "Maßgebende Menge",
      netBeforeDiscount: "Angebotssumme netto vor Nachlässen in EUR",
      percentDiscount: "Prozentualer Nachlass in EUR",
      lumpDiscount: "Pauschalnachlass in EUR",
      netAfterDiscount: "Angebotssumme netto nach Nachlässen in EUR",
      vat: "Umsatzsteuer in EUR",
      gross: "Angebotssumme brutto in EUR",
    },
  },
  en: {
    system: "You are an estimator at a plumbing contractor determining offer totals with the tools. You reach the data only through the tools; calculate with calculate. Read all documents completely before you calculate. Call independent tools in parallel. When you are done, call submit with your result.",
    prompt: "Determine the offer total of Haustechnik Müller GmbH for the bill of quantities \"New daycare centre Sonnenweg 12, sanitary installation\", as the bidder would submit it.",
    titles: { notes: "Preliminary notes to the bill of quantities", "bidder-questions": "Answers to bidder questions", "cover-letter": "Bidder's cover letter" },
    unknown: (id: string) => `Unknown document ${id}. Documents: ${Object.keys(DOCUMENTS).join(", ")}.`,
    noPage: (pages: number) => `There is no such page. The document has ${pages} pages.`,
    tools: {
      list_positions: "Lists the bill of quantities with the bidder's unit prices page by page: ordinal, title, short text, quantity, unit, unit price in EUR, marking. At most 15 items per call.",
      list_documents: "Lists the documents of the offer with their page counts.",
      read_document: "Returns one page of a document.",
    },
    answer: "The offer total with its components.",
    fields: {
      excludedPositions: "Ordinals of all items not included in the offer total",
      changedQuantities: "Items whose applicable quantity differs from the quantity in the bill of quantities, with the applicable quantity",
      ordinal: "Ordinal, e.g. 01.01",
      quantity: "Applicable quantity",
      netBeforeDiscount: "Net offer total before discounts in EUR",
      percentDiscount: "Percentage discount in EUR",
      lumpDiscount: "Lump-sum discount in EUR",
      netAfterDiscount: "Net offer total after discounts in EUR",
      vat: "VAT in EUR",
      gross: "Gross offer total in EUR",
    },
  },
};

const ORDINALS = POSITIONS.map((position) => position.ordinal);
const ordinalOf = (value: unknown) => {
  const match = /(\d{1,2})\.(\d{2})/u.exec(String(value));
  return match ? `${match[1]!.padStart(2, "0")}.${match[2]}` : String(value).trim();
};

const make = (lang: Lang): Task<Record<string, never>, Answer> => {
  const text = TEXT[lang];
  const out = (value: unknown) => ok(localize(lang, value, NAMES_DE));
  return {
    id: `calc-offer-total-${lang}`,
    track: "calc",
    lang,
    title: "Offer total from a paged LV, preliminary notes and amendments",
    description:
      "Computes the offer total of a 123-item tender read page by page, with preliminary notes, bidder answers and a cover letter behind a document tool. Traps: contingency, alternative and without-total items under several names, a contingency title with one item reinstated, three amendments in reverse order (a replacement and a quantity changed twice), answers that reinstate an item and change a quantity, daywork kept in the total, a discount threshold just below the net total on two titles only, a lump-sum discount, and distractors.",
    system: text.system,
    prompt: text.prompt,
    init: () => ({}),
    tools: [
      {
        name: "list_positions",
        description: text.tools.list_positions,
        parameters: pageParameters(15),
        run: (args) => {
          const { rows, ...rest } = page(POSITIONS, args, 15);
          return out({
            ...rest,
            rows: rows.map((position) => ({
              ordinal: position.ordinal,
              title: `${position.ordinal.slice(0, 2)} ${TITLES[position.ordinal.slice(0, 2)]![lang]}`,
              text: position.text[lang],
              quantity: position.quantity,
              unit: UNITS[position.unit]![lang],
              unitPrice: position.unitPrice,
              ...(position.marking ? { marking: position.marking[lang] } : {}),
            })),
          });
        },
      },
      {
        name: "list_documents",
        description: text.tools.list_documents,
        parameters: object({}),
        run: () => out({ documents: (Object.keys(DOCUMENTS) as DocumentId[]).map((id) => ({ id, title: text.titles[id], pages: DOCUMENTS[id][lang].length })) }),
      },
      {
        name: "read_document",
        description: text.tools.read_document,
        parameters: object({ id: { type: "string", enum: Object.keys(DOCUMENTS) }, page: { type: "integer", minimum: 1 } }),
        run: (args) => {
          const id = String(args.id ?? "") as DocumentId;
          if (!(id in DOCUMENTS)) return refuse(lang, text.unknown(id));
          const pages = DOCUMENTS[id][lang];
          const number = Number(args.page ?? 1);
          const content = pages[number - 1];
          if (content === undefined) return refuse(lang, text.noPage(pages.length));
          return out({ id, page: number, pages: pages.length, text: content });
        },
      },
      calculateTool(lang),
    ],
    answer: {
      description: text.answer,
      schema: object({
        excludedPositions: { type: "array", items: { type: "string" }, description: text.fields.excludedPositions },
        changedQuantities: {
          type: "array",
          description: text.fields.changedQuantities,
          items: object({ ordinal: { type: "string", description: text.fields.ordinal }, quantity: { type: "number", description: text.fields.quantity } }),
        },
        netBeforeDiscount: { type: "number", description: text.fields.netBeforeDiscount },
        percentDiscount: { type: "number", description: text.fields.percentDiscount },
        lumpDiscount: { type: "number", description: text.fields.lumpDiscount },
        netAfterDiscount: { type: "number", description: text.fields.netAfterDiscount },
        vat: { type: "number", description: text.fields.vat },
        gross: { type: "number", description: text.fields.gross },
      }),
    },
    grade: (answer) => {
      const excluded = new Set(Array.isArray(answer?.excludedPositions) ? answer.excludedPositions.map(ordinalOf) : []);
      const changed = new Map([...byKey(answer?.changedQuantities, "ordinal")].map(([ordinal, entry]) => [ordinalOf(ordinal), entry]));
      const checks: Record<string, Check> = {};
      for (const ordinal of DECISIONS) checks[`${ordinal} ${EXCLUDED.has(ordinal) ? "excluded" : "counted"}`] = answer !== undefined && excluded.has(ordinal) === EXCLUDED.has(ordinal);
      checks["other items counted"] = answer !== undefined && ORDINALS.every((ordinal) => DECISIONS.includes(ordinal) || !excluded.has(ordinal));
      for (const [ordinal, quantity] of Object.entries(AMENDED_QUANTITIES))
        checks[`${ordinal} amended quantity`] = { score: matches(changed.get(ordinal)?.quantity, quantity, 3) ? 1 : 0, weight: 2 };
      checks["no other quantity changes"] = answer !== undefined && [...changed.keys()].every((ordinal) => ordinal in AMENDED_QUANTITIES);
      for (const [name, value, expected, weight] of [
        ["net before discount", answer?.netBeforeDiscount, GOLD.net, 3],
        ["percentage discount", answer?.percentDiscount, GOLD.percent, 3],
        ["lump-sum discount", answer?.lumpDiscount, GOLD.lump, 1],
        ["net after discount", answer?.netAfterDiscount, GOLD.afterDiscount, 3],
        ["VAT", answer?.vat, GOLD.vat, 1],
        ["gross", answer?.gross, GOLD.gross, 3],
      ] as const)
        checks[name] = { score: matches(value, expected, 2) ? 1 : 0, weight };
      return { checks, metrics: { grossDeviationPct: Math.min(1, relativeDeviation(answer?.gross, GOLD.gross)) * 100 } };
    },
    reference: {
      excludedPositions: [...EXCLUDED],
      changedQuantities: Object.entries(AMENDED_QUANTITIES).map(([ordinal, quantity]) => ({ ordinal, quantity })),
      netBeforeDiscount: GOLD.net,
      percentDiscount: GOLD.percent,
      lumpDiscount: GOLD.lump,
      netAfterDiscount: GOLD.afterDiscount,
      vat: GOLD.vat,
      gross: GOLD.gross,
    },
    maxTurns: 50,
  };
};

export const offerTotal = LANGS.map(make);
