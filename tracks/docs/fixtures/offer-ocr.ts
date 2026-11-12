/**
 * One supplier offer as OCR text over four pages, in German and in English, ported from 90/10's
 * synthetic `bench/extract` fixture and made harder. Price units, discounts, and surcharges come
 * from the line, an inline note, a footnote, or the section header (a quantity discount only above
 * a threshold); OCR misreads two prices; a correction sits at the end of the document.
 */
import type { Lang } from "../../../src/types";
import { formatNumber, type Text } from "../shared";
import type { GoldLine } from "../offer-lines";

type OfferLine = {
  pos: string;
  /** Legend marker: (A) alternative, (B) provisional (Bedarfsposition). */
  marker?: "A" | "B";
  articleNo: string;
  text: Text;
  /** The rest of the description, printed at the top of the next page. */
  continuation?: Text;
  quantity: number;
  unit: Text;
  price: number;
  /** A price unit printed in the text, e.g. "Preis/12 Kartuschen". */
  inlinePriceUnit?: number;
  discount?: number;
  discontinued?: boolean;
  /** OCR merged quantity and unit, e.g. "2.000Stk". */
  merged?: boolean;
  /** Footnote marker; the page footnote sets a price unit ("* Preis je 10 m"). */
  footnote?: number;
  /** Second footnote marker: a metal surcharge per unit, without discount. */
  surcharge?: number;
  /** The price as OCR misread it; the printed total still follows the real price. */
  misread?: Text;
  /** A separate row after the line: "abzgl. 12 % Sonderrabatt auf Pos. 22". */
  special?: number;
  /** Corrected unit price from a correction note at the end. */
  corrected?: number;
  /** OCR put the numbers on the row below the description. */
  twoRow?: boolean;
  page: 1 | 2 | 3 | 4;
};

type Section = { title: Text; priceUnit?: number; discount?: number; bulk?: { from: number; discount: number }; lines: OfferLine[] };

const pcs = { de: "Stk", en: "pcs" };
const m = { de: "m", en: "m" };

export const SECTIONS: Section[] = [
  {
    title: { de: "Entwässerung", en: "Drainage" },
    lines: [
      { pos: "1", articleNo: "100412", text: { de: "KG-Rohr DN 110 x 2000 mm SN4", en: "KG sewer pipe DN 110 x 2000 mm SN4" }, quantity: 21, unit: pcs, price: 9.8, page: 1 },
      { pos: "2", articleNo: "100418", text: { de: "KG-Rohr DN 125 x 2000 mm SN4", en: "KG sewer pipe DN 125 x 2000 mm SN4" }, quantity: 18, unit: pcs, price: 11.4, page: 1 },
      { pos: "3", articleNo: "100699", text: { de: "Mehrpreis Formstücke KG DN 125, gemittelt", en: "Extra price for KG fittings DN 125, averaged" }, quantity: 14, unit: pcs, price: 5.6, page: 1 },
      { pos: "4", marker: "B", articleNo: "600100", text: { de: "Kernbohrung DN 150 in Stahlbeton", en: "Core drilling DN 150 in reinforced concrete" }, quantity: 6, unit: pcs, price: 96.5, page: 1 },
    ],
  },
  {
    title: { de: "Sanitärkeramik – auf alle Preise dieses Abschnitts 8 % Objektrabatt", en: "Sanitary ceramics – 8 % project discount on all prices in this section" },
    discount: 8,
    lines: [
      { pos: "5", articleNo: "310110", text: { de: "Waschtisch Keramag Renova 60 cm weiß", en: "Washbasin Keramag Renova 60 cm white" }, quantity: 6, unit: pcs, price: 142, page: 1 },
      {
        pos: "6",
        marker: "A",
        articleNo: "310120",
        text: { de: "Waschtisch Ideal Standard Eurovit 60 cm weiß, Alternativ zu Pos. 5", en: "Washbasin Ideal Standard Eurovit 60 cm white, alternative to item 5" },
        quantity: 6,
        unit: pcs,
        price: 118,
        page: 1,
      },
      {
        pos: "7",
        articleNo: "310210",
        text: { de: "Wand-WC Keramag Renova Rimfree weiß", en: "Wall-hung WC Keramag Renova Rimfree white" },
        quantity: 6,
        unit: pcs,
        price: 168,
        misread: { de: "l68,0O", en: "l68.0O" },
        page: 1,
      },
    ],
  },
  {
    title: { de: "Vorwandinstallation und Armaturen", en: "Pre-wall installation and fittings" },
    lines: [
      {
        pos: "8",
        articleNo: "330510",
        text: { de: "Montageelement WC, Bauhöhe 112 cm, mit Spülkasten", en: "WC mounting frame, height 112 cm, with cistern" },
        quantity: 6,
        unit: pcs,
        price: 389,
        discount: 22,
        page: 1,
      },
      { pos: "9", articleNo: "410020", text: { de: "Duschthermostat AP Art. 4471", en: "Surface-mounted shower thermostat art. 4471" }, quantity: 4, unit: pcs, price: 210, discontinued: true, page: 1 },
      {
        pos: "10",
        articleNo: "410028",
        text: { de: "Duschthermostat AP Art. 4480 (Ersatz für", en: "Surface-mounted shower thermostat art. 4480 (replaces" },
        continuation: { de: "Art. 4471), verchromt", en: "art. 4471), chrome-plated" },
        quantity: 4,
        unit: pcs,
        price: 224.5,
        page: 1,
      },
    ],
  },
  {
    title: {
      de: "Befestigung – Preise je 100 Stück; ab 2.000 Stück je Artikel zusätzlich 3 % Mengenrabatt auf den EP",
      en: "Fixings – prices per 100 pieces; from 2,000 pieces per article an additional 3 % quantity discount on the unit price",
    },
    priceUnit: 100,
    bulk: { from: 2000, discount: 3 },
    lines: [
      { pos: "11", articleNo: "220190", text: { de: 'Befestigungsschelle M8 1/2" mit Gummieinlage', en: 'Pipe clamp M8 1/2" with rubber insert' }, quantity: 300, unit: pcs, price: 46, page: 2 },
      {
        pos: "12",
        articleNo: "220196",
        text: { de: 'Befestigungsschelle M10 1" mit Gummieinlage', en: 'Pipe clamp M10 1" with rubber insert' },
        quantity: 1000,
        unit: pcs,
        price: 71,
        discount: 5,
        corrected: 68.4,
        page: 2,
      },
      { pos: "13", articleNo: "500408", text: { de: "Spreizdübel 8 x 40 mm Nylon", en: "Expansion plug 8 x 40 mm nylon" }, quantity: 2000, unit: pcs, price: 8, discount: 10, page: 2 },
      {
        pos: "14",
        marker: "A",
        articleNo: "500410",
        text: { de: "Spreizdübel 10 x 50 mm Nylon, Alternativ zu Pos. 13", en: "Expansion plug 10 x 50 mm nylon, alternative to item 13" },
        quantity: 2000,
        unit: pcs,
        price: 11,
        discount: 10,
        merged: true,
        page: 2,
      },
    ],
  },
  {
    title: { de: "Abdichtung und Fliesen", en: "Waterproofing and tiles" },
    lines: [
      {
        pos: "15",
        articleNo: "520300",
        text: { de: "Dichtschlämme 2K flexibel, Gebinde 24 kg", en: "Flexible 2-component waterproofing slurry, 24 kg bucket" },
        quantity: 12,
        unit: { de: "Geb", en: "bkt" },
        price: 96,
        discount: 5,
        page: 2,
      },
      { pos: "16", articleNo: "520410", text: { de: "Flexkleber C2TE S1, Sack 25 kg", en: "Flexible tile adhesive C2TE S1, 25 kg bag" }, quantity: 1.5, unit: { de: "t", en: "t" }, price: 750, page: 2 },
      {
        pos: "17",
        articleNo: "530360",
        text: { de: "Feinsteinzeug 30 x 60 cm grau matt, Paket 1,44 m²", en: "Porcelain stoneware 30 x 60 cm grey matt, pack 1.44 m²" },
        quantity: 59,
        unit: { de: "Pak", en: "pk" },
        price: 51.84,
        page: 2,
      },
      {
        pos: "18",
        articleNo: "540310",
        text: { de: "Sanitärsilikon 310 ml transparent, Preis/12 Kartuschen", en: "Sanitary silicone 310 ml clear, price/12 cartridges" },
        quantity: 24,
        unit: pcs,
        price: 66,
        inlinePriceUnit: 12,
        page: 2,
      },
    ],
  },
  {
    title: { de: "Rohre und Dämmung", en: "Pipes and insulation" },
    lines: [
      { pos: "19", articleNo: "250015", text: { de: "Cu-Rohr 15x1,0 hart", en: "Copper pipe 15x1.0 hard" }, quantity: 150, unit: m, price: 92.5, footnote: 10, surcharge: 0.38, page: 3 },
      { pos: "20", articleNo: "250018", text: { de: "Cu-Rohr 18x1,0 hart", en: "Copper pipe 18x1.0 hard" }, quantity: 90, unit: m, price: 119.1, footnote: 10, surcharge: 0.46, page: 3 },
      {
        pos: "21",
        articleNo: "240022",
        text: { de: "Edelstahl-Pressrohr 22 x 1,0 mm, in Stangen à 6 m", en: "Stainless steel press pipe 22 x 1.0 mm, in 6 m lengths" },
        quantity: 128,
        unit: m,
        price: 10.2,
        twoRow: true,
        page: 3,
      },
      {
        pos: "22",
        articleNo: "240028",
        text: { de: "Edelstahl-Pressrohr 28 x 1,0 mm, in Stangen à 6 m", en: "Stainless steel press pipe 28 x 1.0 mm, in 6 m lengths" },
        quantity: 64,
        unit: m,
        price: 13.8,
        special: 12,
        page: 3,
      },
      { pos: "23", articleNo: "2302213", text: { de: "Isolierschlauch 22 x 13 mm Kautschuk", en: "Insulation tube 22 x 13 mm rubber" }, quantity: 128, unit: m, price: 21, footnote: 10, page: 3 },
      { pos: "24", marker: "B", articleNo: "230289", text: { de: "Isolierschlauch 28 x 9 mm Kautschuk", en: "Insulation tube 28 x 9 mm rubber" }, quantity: 64, unit: m, price: 19, footnote: 10, page: 3 },
      {
        pos: "25",
        articleNo: "260020",
        text: { de: 'Absperrventil 3/4" Messing mit Entleerung', en: 'Stop valve 3/4" brass with drain' },
        quantity: 10,
        unit: pcs,
        price: 15.9,
        discount: 3,
        page: 3,
      },
      {
        pos: "26",
        marker: "A",
        articleNo: "260021",
        text: { de: 'Kugelhahn 3/4" Messing, Alternativ zu Pos. 25', en: 'Ball valve 3/4" brass, alternative to item 25' },
        quantity: 10,
        unit: pcs,
        price: 12.4,
        twoRow: true,
        page: 3,
      },
      {
        pos: "27",
        articleNo: "410512",
        text: { de: "Waschtisch-Einhebelmischer verchromt", en: "Single-lever basin mixer, chrome-plated" },
        quantity: 8,
        unit: pcs,
        price: 86.4,
        misread: { de: "B6,4O", en: "B6.4O" },
        page: 3,
      },
      {
        pos: "28",
        articleNo: "770110",
        text: { de: "Brausegarnitur mit Stange 90 cm, Art. 7710", en: "Shower set with 90 cm rail, art. 7710" },
        quantity: 4,
        unit: pcs,
        price: 64.5,
        discontinued: true,
        page: 3,
      },
    ],
  },
  {
    title: { de: "Lohnleistungen", en: "Labour" },
    lines: [
      { pos: "29", articleNo: "700010", text: { de: "Monteurstunde", en: "Fitter hour" }, quantity: 24, unit: { de: "h", en: "h" }, price: 58, page: 4 },
      { pos: "30", marker: "B", articleNo: "700020", text: { de: "Helferstunde", en: "Helper hour" }, quantity: 16, unit: { de: "h", en: "h" }, price: 44, page: 4 },
      { pos: "31", articleNo: "900420", text: { de: "Montage Duschrinne je Stk", en: "Install shower channel, each" }, quantity: 3, unit: pcs, price: 65, page: 4 },
    ],
  },
];

export const PAGES = 4;
const ALL_LINES = SECTIONS.flatMap((section) => section.lines);
const sectionOf = (line: OfferLine) => SECTIONS.find((section) => section.lines.includes(line))!;
const priceUnitOf = (line: OfferLine) => line.inlinePriceUnit ?? line.footnote ?? sectionOf(line).priceUnit ?? 1;
const round2 = (value: number) => Math.round(value * 100) / 100;
const bulkOf = (line: OfferLine) => {
  const bulk = sectionOf(line).bulk;
  return bulk && line.quantity >= bulk.from ? bulk.discount : 0;
};

/** The printed total: quantity × price / price unit, less the line discount (not the section's). */
const printedTotal = (line: OfferLine) => round2(((line.quantity * line.price) / priceUnitOf(line)) * (1 - (line.discount ?? 0) / 100));

export const GOLD_LINES: GoldLine[] = ALL_LINES.map((line) => ({
  pos: line.pos,
  articleNo: line.articleNo,
  quantity: line.quantity,
  unit: line.unit,
  unitPrice:
    ((line.corrected ?? line.price) / priceUnitOf(line)) *
    (1 - (line.discount ?? 0) / 100) *
    (1 - (sectionOf(line).discount ?? 0) / 100) *
    (1 - bulkOf(line) / 100) *
    (1 - (line.special ?? 0) / 100) +
    (line.surcharge ?? 0),
  lineTotal: line.discontinued ? null : printedTotal(line),
  alternative: line.marker === "A",
  optional: line.marker === "B",
  discontinued: Boolean(line.discontinued),
  gradeTotal: line.corrected === undefined,
}));

const COPY = {
  de: {
    header: "Pos.    Art.-Nr. Bezeichnung                                                Menge   ME    EP        Rab.   GP",
    legend: "(A) = Alternativposition, wird nicht in die Summe eingerechnet · (B) = Bedarfsposition",
    footnote: "* Preis je 10 m",
    surcharge: (values: string) => `** zzgl. Metallzuschlag je m, nicht rabattfähig, im GP nicht enthalten: ${values}`,
    page: (page: number) => `Seite ${page} von ${PAGES}`,
    vat: "USt-IdNr.",
    pageHeader: (page: number) => `Haustechnik Müller GmbH · Angebot 2026-131 · Seite ${page}`,
    carry: "Übertrag",
    posLabel: "Pos.",
    discontinued: "entfällt",
    special: (percent: number, pos: string) => `abzgl. ${percent} % Sonderrabatt auf Pos. ${pos}`,
    intro: [
      "Haustechnik Müller GmbH · Industriestr. 14 · 10115 Berlin",
      "ANGEBOT Nr. 2026-131 vom 02.10.2026",
      "Bauvorhaben: Kita Sonnenweg, Sanitär",
      "Alle Preise in EUR netto zzgl. gesetzl. MwSt. EP je Mengeneinheit, sofern im Abschnitt nicht anders angegeben.",
    ],
    sum: "Summe Positionen",
    projectDiscount: "abzgl. 8 % Objektrabatt Sanitärkeramik",
    net: "Nettosumme",
    vatLine: "zzgl. 19 % MwSt.",
    gross: "Gesamtbetrag brutto",
    correction: (pos: string, corrected: string, price: string) => `Berichtigung zu Pos. ${pos}: Der EP beträgt ${corrected} € statt ${price} €.`,
  },
  en: {
    header: "Item    Art. no. Description                                                Qty     Unit  UP        Disc.  Total",
    legend: "(A) = alternative item, not included in the total · (B) = provisional item",
    footnote: "* Price per 10 m",
    surcharge: (values: string) => `** plus metal surcharge per m, not discountable, not included in the total: ${values}`,
    page: (page: number) => `Page ${page} of ${PAGES}`,
    vat: "VAT ID",
    pageHeader: (page: number) => `Haustechnik Müller GmbH · Offer 2026-131 · Page ${page}`,
    carry: "Carried forward",
    posLabel: "item",
    discontinued: "discontinued",
    special: (percent: number, pos: string) => `less ${percent} % special discount on item ${pos}`,
    intro: [
      "Haustechnik Müller GmbH · Industriestr. 14 · 10115 Berlin",
      "OFFER No. 2026-131 dated 2 October 2026",
      "Project: Sonnenweg day-care centre, plumbing",
      "All prices in EUR net plus statutory VAT. Unit price per unit of quantity unless the section states otherwise.",
    ],
    sum: "Total of items",
    projectDiscount: "less 8 % project discount sanitary ceramics",
    net: "Net total",
    vatLine: "plus 19 % VAT",
    gross: "Gross total",
    correction: (pos: string, corrected: string, price: string) => `Correction to item ${pos}: the unit price is EUR ${corrected}, not EUR ${price}.`,
  },
};

const pad = (value: string, width: number) => value.padEnd(width);
const counted = (line: OfferLine) => !line.marker && !line.discontinued;

/** The offer's pages as OCR delivers them: repeated headers, carry-overs, a wrapped line. */
export const offerPages = (lang: Lang): string[] => {
  const copy = COPY[lang];
  const number = (value: number, digits = 2) => formatNumber(lang, value, digits);
  const printed = (line: OfferLine) =>
    line.discontinued ? copy.discontinued : line.marker === "A" ? `(${number(printedTotal(line))})` : number(printedTotal(line));
  const row = (line: OfferLine) => {
    const quantity = number(line.quantity, line.quantity % 1 ? 1 : 0);
    const pos = `${line.pos}${line.marker ? ` (${line.marker})` : ""}`;
    const text = `${line.text[lang]}${line.footnote ? "*" : ""}${line.surcharge ? "/**" : ""}`;
    const figures = [
      line.merged ? pad(`${quantity}${line.unit[lang]}`, 13) : `${pad(quantity, 7)} ${pad(line.unit[lang], 5)}`,
      pad(line.misread?.[lang] ?? number(line.price), 9),
      pad(line.discount ? `-${line.discount}%` : "", 6),
      printed(line),
    ].join(" ");
    return line.twoRow
      ? `${pad(pos, 7)} ${pad(line.articleNo, 8)} ${text}\n${" ".repeat(76)}${figures}`
      : [pad(pos, 7), pad(line.articleNo, 8), pad(text, 58), figures].join(" ");
  };
  const carry = (page: number) => ALL_LINES.filter((line) => line.page < page && counted(line)).reduce((sum, line) => sum + printedTotal(line), 0);
  const continued = ALL_LINES.find((line) => line.continuation)!;

  return ([1, 2, 3, 4] as const).map((page) => {
    const out: string[] = page === 1 ? [...copy.intro, ""] : [copy.pageHeader(page), `${copy.carry} ${number(carry(page))}`];
    out.push(copy.header);
    if (page === continued.page + 1) out.push(`                 ${continued.continuation![lang]}`);
    for (const section of SECTIONS) {
      const lines = section.lines.filter((line) => line.page === page);
      if (!lines.length) continue;
      if (lines[0] === section.lines[0]) out.push(`  ${section.title[lang]}`);
      for (const line of lines) {
        out.push(row(line));
        if (line.special) out.push(`        ${copy.special(line.special, line.pos)}`);
      }
    }
    if (page === PAGES) {
      const net = ALL_LINES.filter(counted).reduce((sum, line) => sum + printedTotal(line), 0);
      const ceramics = SECTIONS[1]!.lines.filter(counted).reduce((sum, line) => sum + printedTotal(line), 0) * 0.08;
      const dots = (label: string, value: string) => `        ${label} ${".".repeat(Math.max(3, 82 - label.length))} ${value}`;
      out.push(
        "",
        dots(copy.sum, number(net)),
        dots(copy.projectDiscount, `-${number(ceramics)}`),
        dots(copy.net, number(net - ceramics)),
        dots(copy.vatLine, number((net - ceramics) * 0.19)),
        dots(copy.gross, number((net - ceramics) * 1.19)),
        "",
        ...ALL_LINES.filter((line) => line.corrected).map((line) => copy.correction(line.pos, number(line.corrected!), number(line.price))),
      );
    }
    const surcharged = ALL_LINES.filter((line) => line.page === page && line.surcharge);
    const footnote = [
      ...(ALL_LINES.some((line) => line.page === page && line.footnote) ? [copy.footnote] : []),
      ...(surcharged.length ? [copy.surcharge(surcharged.map((line) => `${copy.posLabel} ${line.pos} ${number(line.surcharge!)} €`).join(", "))] : []),
    ];
    out.push("", ...footnote, `${copy.page(page)} · Haustechnik Müller GmbH · ${copy.vat} DE 284 551 902 · ${copy.legend}`);
    return out.join("\n");
  });
};
